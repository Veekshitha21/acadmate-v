// utils/sendEmail.js
require('dotenv').config();
const nodemailer = require("nodemailer");
const { db } = require("../config/firebase");

// Helper function to get Gmail password (removes spaces)
const getGmailPassword = () => {
  const password =  process.env.EMAIL_PASS;
  // Remove spaces from app password (Gmail app passwords sometimes have spaces)
  return password ? password.replace(/\s+/g, '') : password;
};

// ✅ Gmail transporter setup
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// ✅ General sendEmail utility
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const fromEmail = process.env.EMAIL_USER 
    await transporter.sendMail({
      from: `"AcadMate" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`, // Use HTML if provided, otherwise wrap text
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error; // Re-throw so callers can handle errors
  }
};

// 🔔 Scheduled reminder processing (run with cron)
const sendEventReminders = async () => {
  try {
    const snapshot = await db.collection("events").get();
    const now = new Date();

    for (const doc of snapshot.docs) {
      const reminder = doc.data();
      const reminderDate = new Date(reminder.date);
      const hoursDiff = (reminderDate - now) / (1000 * 60 * 60);

      if (reminderDate < now) {
        await db.collection("events").doc(doc.id).delete();
        continue;
      }

      // 1-day reminder
      if (hoursDiff <= 24 && hoursDiff > 21 && !reminder.emailSent) {
        await sendEmail({
          to: reminder.email,
          subject: `Reminder: ${reminder.title} is Tomorrow!`,
          text: `Hey! Don't forget your ${reminder.type} "${reminder.title}" tomorrow.`,
        });
        await db.collection("events").doc(doc.id).update({
          emailSent: true,
          lastReminderSent: new Date().toISOString(),
        });
      }

      // 3-hour reminder
      if (hoursDiff <= 24 && hoursDiff > 0) {
        const lastSent = reminder.lastReminderSent ? new Date(reminder.lastReminderSent) : null;
        const hoursSinceLast = lastSent ? (now - lastSent) / (1000 * 60 * 60) : Infinity;

        if (hoursSinceLast >= 3) {
          await sendEmail({
            to: reminder.email,
            subject: `⏰ Upcoming: ${reminder.title} in ${Math.round(hoursDiff)}h`,
            text: `Hey! Your ${reminder.type} "${reminder.title}" starts soon.`,
          });
          await db.collection("events").doc(doc.id).update({
            lastReminderSent: new Date().toISOString(),
          });
        }
      }

      // Daily reminders for events within 7 days
      const daysDiff = Math.floor((reminderDate - now) / (1000 * 60 * 60 * 24));
      if (daysDiff >= 1 && daysDiff <= 7) {
        const lastSent = reminder.lastReminderSent ? new Date(reminder.lastReminderSent) : null;
        const hoursSinceLast = lastSent ? (now - lastSent) / (1000 * 60 * 60) : Infinity;

        if (hoursSinceLast >= 24) {
          await sendEmail({
            to: reminder.email,
            subject: `Reminder: ${reminder.title} is coming up`,
            text: `Hi! Your ${reminder.type} "${reminder.title}" is scheduled for ${reminder.date}.`,
          });
          await db.collection("events").doc(doc.id).update({
            lastReminderSent: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.error("❌ Error processing reminders:", error.message);
  }
};

module.exports = { sendEmail, sendEventReminders };