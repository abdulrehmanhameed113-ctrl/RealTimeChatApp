const express = require("express");

const router = express.Router();
const upload = require("../middleware/upload.middleware");
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const {
    registerUser,
    loginUser,
    getProfile,
     updateProfile,
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);

// Protected Route
router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, upload.single("profilePic"), updateProfile);

module.exports = router;