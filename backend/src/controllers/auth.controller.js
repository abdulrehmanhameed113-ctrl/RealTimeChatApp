const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadToCloudinary } = require("../utils/cloudinary");

// ================= Register User =================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        const userObj = user.toObject();
        delete userObj.password;

        res.status(201).json({
            message: "User registered successfully",
            user: userObj,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

// ================= Login User =================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please fill all fields",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        const userObj = user.toObject();
        delete userObj.password;

        res.status(200).json({
            message: "Login successful",
            token,
            user: userObj,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

// ================= Get Profile =================
const getProfile = async (req, res) => {
    res.status(200).json({
        message: "Protected Route Accessed Successfully",
        user: req.user,
    });
};

// ================= Update Profile =================
const updateProfile = async (req, res) => {
    try {

        const userId = req.user._id;

        let profilePic = req.user.profilePic;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, "chat-app-profiles");
            profilePic = result.secure_url;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profilePic,
            },
            {
                new: true,
            }
        ).select("-password");

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
};