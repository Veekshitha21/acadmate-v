// controllers/reminderController.js
const { db } = require("../config/firebase");
const { sendEmail } = require("../utils/sendEmail");

/* =========================
   GET USER REMINDERS
========================= */
const getUserReminders = async (req, res) => {
  console.log("📅 getUserReminders called");

  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const snapshot = await db
      .collection("events")
      .where("userId", "==", userId)
      .get();

    const reminders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ events: reminders });
  } catch (error) {
    console.error("❌ Error fetching reminders:", error);
    res.status(500).json({
      message: "Error fetching reminders",
      error: error.message,
    });
  }
};

/* =========================
   ADD REMINDER
========================= */
const addReminder = async (req, res) => {
  console.log("➕ addReminder called");

  try {
    const { userId, email, title, date, type } = req.body;

    if (!userId || !email || !title || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const docRef = await db.collection("events").add({
      userId,
      email,
      title,
      date,
      type: type || "event",
      createdAt: new Date().toISOString(),
    });

    const newDoc = await docRef.get();
    const eventData = { id: newDoc.id, ...newDoc.data() };

    // fire-and-forget email
    sendEmail({
      to: email,
      subject: `New Event Added: ${title}`,
      text: `You added a new ${type || "event"} "${title}" scheduled for ${date}.`,
    }).catch((err) => console.error("Email error:", err));

    res.status(200).json(eventData);
  } catch (error) {
    console.error("❌ Error adding reminder:", error);
    res.status(500).json({
      message: "Failed to add reminder",
      error: error.message,
    });
  }
};

/* =========================
   DELETE REMINDER
========================= */
const deleteReminder = async (req, res) => {
  console.log("🗑️ deleteReminder called");

  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Missing eventId" });
    }

    await db.collection("events").doc(eventId).delete();
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting reminder:", error);
    res.status(500).json({
      message: "Failed to delete reminder",
      error: error.message,
    });
  }
};

/* =========================
   SEND REMINDER EMAIL
========================= */
const sendReminderEmail = async (req, res) => {
  try {
    const { email, eventTitle, eventDate } = req.body;

    if (!email || !eventTitle || !eventDate) {
      return res.status(400).json({ message: "Missing email fields" });
    }

    await sendEmail({
      to: email,
      subject: `Reminder: ${eventTitle}`,
      text: `Reminder for "${eventTitle}" scheduled on ${eventDate}`,
    });

    res.json({ success: true, message: "Reminder email sent" });
  } catch (error) {
    console.error("❌ Error sending reminder email:", error);
    res.status(500).json({
      message: "Failed to send reminder email",
      error: error.message,
    });
  }
};

/* =========================
   EXPORTS (IMPORTANT)
========================= */
module.exports = {
  getUserReminders,
  addReminder,
  deleteReminder,
  sendReminderEmail,
};
