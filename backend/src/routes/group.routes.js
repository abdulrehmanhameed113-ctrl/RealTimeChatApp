const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth.middleware");
const {
    createGroup,
    getGroups,
    joinGroup,
    leaveGroup,
} = require("../controllers/group.controller");

router.post("/", protect, createGroup);
router.get("/", protect, getGroups);
router.post("/:id/join", protect, joinGroup);
router.post("/:id/leave", protect, leaveGroup);

module.exports = router;
