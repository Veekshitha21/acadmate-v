// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, admin } = require('../middleware/auth');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const bucket = admin.storage().bucket();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/javascript',
      'text/html',
      'text/css',
      'application/json'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and code files are allowed.'));
    }
  }
});

// POST /api/upload - Upload file to Firebase Storage
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const discussionId = req.body.discussionId || 'temp';
    const file = req.file;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = `discussions/${discussionId}/${fileName}`;

    // Create file reference
    const fileRef = bucket.file(filePath);

    // Upload file
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          originalName: file.originalname,
          uploadedBy: req.user.uid,
          uploadedAt: new Date().toISOString()
        }
      },
      public: true // Make file publicly accessible
    });

    // Get public URL
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: '03-01-2500' // Far future expiration
    });

    // Alternative: Get public URL without signed URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    res.json({
      url: publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      path: filePath
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /api/upload - Delete file from Firebase Storage
router.delete('/', verifyToken, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Get file metadata to check ownership
    const fileRef = bucket.file(filePath);
    const [metadata] = await fileRef.getMetadata();

    // Verify ownership or admin
    const uploadedBy = metadata.metadata?.uploadedBy;
    const userDoc = await admin.firestore().collection('users').doc(req.user.uid).get();
    const isAdmin = userDoc.exists && userDoc.data().role === 'admin';

    if (uploadedBy !== req.user.uid && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    await fileRef.delete();

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    
    if (error.code === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;