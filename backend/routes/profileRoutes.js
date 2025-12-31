const express = require("express");
const { getUserProfile } = require("../controllers/profileController");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();
router.get("/:id", verifyToken, getUserProfile);

module.exports = router;
