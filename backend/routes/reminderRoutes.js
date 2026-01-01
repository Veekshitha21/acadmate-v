const express = require("express");
const router = express.Router();

const {
  getUserReminders,
  addReminder,
  deleteReminder,
  sendReminderEmail,
} = require("../controllers/reminderController");

router.get("/user/:userId", getUserReminders);
router.post("/add", addReminder);
router.delete("/:eventId", deleteReminder);
router.post("/send", sendReminderEmail);

module.exports = router;
