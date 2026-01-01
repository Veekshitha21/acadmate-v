// middleware/auth.js
// Supports BOTH JWT auth and Firebase Auth (choose one per route)

const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

/* ================================
   ENV CONFIG
================================ */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/* ================================
   JWT AUTH MIDDLEWARE
   (For custom login system)
================================ */
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: 'Token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      uid: decoded.userId || decoded.id,
      email: decoded.email,
      role: decoded.role || 'user',
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }

    return res.status(403).json({ error: 'Authentication failed' });
  }
};

/* ================================
   FIREBASE AUTH MIDDLEWARE
   (For Firebase Authentication)
================================ */
const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired' });
    }

    return res.status(403).json({ error: 'Firebase authentication failed' });
  }
};

module.exports = {
  verifyToken,          // JWT auth
  verifyFirebaseToken,  // Firebase auth
  admin,
};
