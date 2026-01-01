// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cron = require("node-cron");
const admin = require("firebase-admin");
const multer = require("multer");

/* ================================
   EXPRESS APP
================================ */
const app = express();

/* ================================
   FIREBASE ADMIN INITIALIZATION
   (Initialize ONCE)
================================ */
try {
  const serviceAccount = require("./config/serviceAccountKey.json");

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.FIREBASE_BUCKET ||
      "your-project-id.appspot.com",
  });

  console.log("✅ Firebase Admin initialized");

  const bucket = admin.storage().bucket();
  console.log("📦 Firebase Storage bucket:", bucket.name);
} catch (error) {
  console.error("❌ Firebase initialization failed:", error.message);
  process.exit(1);
}

/* ================================
   SECURITY & MIDDLEWARE
================================ */
app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      process.env.CLIENT_URL,
    ],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ================================
   RATE LIMITERS
================================ */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts, try again later.",
});

app.use("/api", apiLimiter);

/* ================================
   ROUTES
================================ */
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const attendanceRoutes = require("./routes/attendance");

const discussionsRouter = require("./routes/discussions");
const commentsRouter = require("./routes/comments");
const uploadRouter = require("./routes/upload");

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/reminder", reminderRoutes);
app.use("/api/attendance", attendanceRoutes);

app.use("/api/discussions", discussionsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/upload", uploadRouter);

/* ================================
   HEALTH CHECK
================================ */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    firebase: admin.apps.length ? "initialized" : "not initialized",
    bucket: admin.storage().bucket().name,
  });
});

/* ================================
   ROOT
================================ */
app.get("/", (req, res) => {
  res.json({ message: "🚀 Acadmate Backend API Running" });
});

/* ================================
   CRON JOB (Daily Reminder)
================================ */
const { sendEventReminders } = require("./controllers/reminderController");

cron.schedule("0 8 * * *", async () => {
  console.log("⏰ Running daily reminder job...");
  try {
    await sendEventReminders();
  } catch (err) {
    console.error("❌ Reminder cron error:", err);
  }
});

/* ================================
   GLOBAL ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error("🔥 Server error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Max 10MB allowed.",
      });
    }
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

/* ================================
   404 HANDLER
================================ */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================================
   START SERVER
================================ */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Server running on port ${PORT}     ║
║   🌐 http://localhost:${PORT}/api/health║
║   🔥 Firebase Admin: READY              ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;
