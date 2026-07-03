const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth.middleware");
const { getUsers } = require("../controllers/user.controller");

router.get("/", protect, getUsers);

module.exports = router;