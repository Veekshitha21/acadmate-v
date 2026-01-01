// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { verifyToken } = require("../middleware/auth");
const admin = require("firebase-admin");

/* ============================
   GET STORAGE BUCKET
============================ */
let bucket;
try {
  bucket = admin.storage().bucket();
  console.log('✅ Storage bucket initialized:', bucket.name);
} catch (error) {
  console.error('❌ Failed to initialize storage bucket:', error.message);
}

/* ============================
   MULTER CONFIG (MEMORY)
============================ */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/javascript",
      "text/html",
      "text/css",
      "application/json",
      "text/markdown"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

/* ============================
   HELPER: Get file view type
============================ */
function getViewType(mimeType) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  return "download";
}

/* ============================
   POST /api/upload
   Upload & return VIEW-ONLY URL
============================ */
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    console.log('📥 Upload request from user:', req.user.uid);
    
    // Check if bucket is initialized
    if (!bucket) {
      console.error('❌ Storage bucket not initialized');
      return res.status(500).json({ 
        error: 'Storage service not configured',
        details: 'Firebase Storage bucket not initialized'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log('📄 File received:', {
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype
    });

    const discussionId = req.body.discussionId || "temp";
    const file = req.file;

    // Generate unique filename
    const extension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${extension}`;
    const filePath = `discussions/${discussionId}/${fileName}`;

    console.log('📤 Uploading to:', filePath);

    const fileRef = bucket.file(filePath);

    /* ===== Upload to Firebase ===== */
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        contentDisposition: `inline; filename="${file.originalname}"`,
        cacheControl: "public, max-age=3600",
        metadata: {
          originalName: file.originalname,
          uploadedBy: req.user.uid,
          uploadedAt: new Date().toISOString(),
          viewOnly: "true"
        }
      }
    });

    console.log('✅ File uploaded to storage');

    /* ===== Generate SIGNED VIEW URL ===== */
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
      responseDisposition: `inline; filename="${file.originalname}"`,
      responseType: file.mimetype
    });

    console.log('✅ Signed URL generated');

    const response = {
      url: signedUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      path: filePath,
      viewType: getViewType(file.mimetype)
    };

    console.log('✅ Upload complete:', file.originalname);

    res.json(response);
  } catch (error) {
    console.error("💥 Upload error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    // Send detailed error in development
    res.status(500).json({ 
      error: "File upload failed",
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/* ============================
   DELETE /api/upload
============================ */
router.delete("/", verifyToken, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: "File path required" });
    }

    console.log('🗑️ Delete request for:', filePath);

    const fileRef = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await fileRef.exists();
    if (!exists) {
      return res.status(404).json({ error: "File not found" });
    }

    const [metadata] = await fileRef.getMetadata();
    const uploadedBy = metadata.metadata?.uploadedBy;

    // Check if user owns the file or is admin
    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    if (uploadedBy !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to delete this file" });
    }

    await fileRef.delete();

    console.log('✅ File deleted:', filePath);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("💥 Delete error:", error);
    res.status(500).json({ 
      error: "Failed to delete file",
      message: error.message
    });
  }
});

module.exports = router;