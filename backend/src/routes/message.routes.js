const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

const {
    sendMessage,
    getMessages,
    markAsRead,
} = require("../controllers/message.controller");

router.post("/send/:id", protect, upload.single("image"), sendMessage);
router.post("/read/:id", protect, markAsRead);

router.get("/:id", protect, getMessages);

module.exports = router;