const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");

const db = admin.firestore();

// ✅ Get all attendance for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const snapshot = await db.collection("attendance").where("userId", "==", userId).get();
    const records = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mark attendance with Predictable ID
router.post("/mark", async (req, res) => {
  try {
    const { userId, subject, date, status } = req.body; 
    if (!userId || !subject || !date) return res.status(400).json({ error: "Missing fields" });

    // ⭐ Create a unique, predictable ID matching your DELETE route logic
    const docId = `${userId}_${subject}_${date}_${status}`; 

    await db.collection("attendance").doc(docId).set({
      userId,
      subject,
      date,
      status,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ✅ Delete a single session
router.delete("/:userId/:subject/:date/:status", async (req, res) => {
  try {
    const { userId, subject, date, status } = req.params;
    const docId = `${userId}_${subject}_${date}_${status}`;
    await db.collection("attendance").doc(docId).delete();
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete all sessions for a subject (Fixed Undefined Variables)
router.delete("/:userId/:subject", async (req, res) => {
  try {
    const { userId, subject } = req.params;
    const snapshot = await db
      .collection("attendance")
      .where("userId", "==", userId)
      .where("subject", "==", subject)
      // REMOVED: .where("date") and .where("status") as they are undefined here
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No sessions found for this subject" });
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    res.json({ message: `All sessions for ${subject} deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Get the list of subjects stored in the user's document
router.get("/subjects/list/:userId", async (req, res) => {
  try {
    const userDoc = await db.collection("users").doc(req.params.userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    res.json(userDoc.data().subjects || []); // Return subjects array or empty
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ NEW: Save the list of subjects to the user's document
router.post("/subjects/sync", async (req, res) => {
  try {
    const { userId, subjects } = req.body;
    await db.collection("users").doc(userId).update({ subjects });
    res.json({ message: "Subjects synced to DB" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;