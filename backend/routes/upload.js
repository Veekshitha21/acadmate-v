// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { verifyToken, admin } = require("../middleware/auth");

const bucket = admin.storage().bucket();

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
      "application/json"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  }
});

/* ============================
   POST /api/upload
   Upload & return VIEW-ONLY URL
============================ */
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const discussionId = req.body.discussionId || "temp";
    const file = req.file;

    const extension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${extension}`;
    const filePath = `discussions/${discussionId}/${fileName}`;

    const fileRef = bucket.file(filePath);

    /* ===== Upload to Firebase ===== */
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        contentDisposition: "inline", // OPEN IN BROWSER
        cacheControl: "no-store",
        metadata: {
          originalName: file.originalname,
          uploadedBy: req.user.uid,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    /* ===== Generate SIGNED VIEW URL ===== */
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    res.json({
      url: signedUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      path: filePath
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
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

    const fileRef = bucket.file(filePath);
    const [metadata] = await fileRef.getMetadata();

    const uploadedBy = metadata.metadata?.uploadedBy;

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(req.user.uid)
      .get();

    const isAdmin = userDoc.exists && userDoc.data().role === "admin";

    if (uploadedBy !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await fileRef.delete();

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

module.exports = router;
