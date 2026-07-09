const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { uploadToCloudinary } = require("../utils/cloudinary");

// Helper to generate access and refresh tokens
const generateTokens = async (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh"),
        { expiresIn: "7d" }
    );
    return { accessToken, refreshToken };
};

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

        const { accessToken, refreshToken } = await generateTokens(user._id);

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshTokens;

        res.status(201).json({
            message: "User registered successfully",
            token: accessToken,
            refreshToken,
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

        const { accessToken, refreshToken } = await generateTokens(user._id);

        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.refreshTokens;

        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            refreshToken,
            user: userObj,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

// ================= Refresh Token Rotation =================
const refreshToken = async (req, res) => {
    try {
        const tokenFromCookie = req.cookies.refreshToken;
        const tokenFromBody = req.body.refreshToken;
        const incomingRefreshToken = tokenFromCookie || tokenFromBody;

        if (!incomingRefreshToken) {
            return res.status(401).json({ message: "Refresh token is required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                incomingRefreshToken,
                process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh")
            );
        } catch (err) {
            return res.status(401).json({ message: "Invalid or expired refresh token" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        // Token reuse detection
        if (!user.refreshTokens.includes(incomingRefreshToken)) {
            user.refreshTokens = [];
            await user.save();
            res.clearCookie("refreshToken");
            return res.status(403).json({ message: "Compromised session. Please log in again." });
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user._id);

        user.refreshTokens = user.refreshTokens.filter(t => t !== incomingRefreshToken);
        user.refreshTokens.push(newRefreshToken);
        await user.save();

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            token: accessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        console.error("Error in refreshToken:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ================= Logout User =================
const logoutUser = async (req, res) => {
    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (incomingRefreshToken) {
            let decoded;
            try {
                decoded = jwt.verify(
                    incomingRefreshToken,
                    process.env.JWT_REFRESH_SECRET || (process.env.JWT_SECRET + "_refresh")
                );
                await User.findByIdAndUpdate(decoded.userId, {
                    $pull: { refreshTokens: incomingRefreshToken }
                });
            } catch (err) {
                // Ignore decode errors
            }
        }

        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Error in logoutUser:", error);
        res.status(500).json({ message: "Internal Server Error" });
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
        ).select("-password -refreshTokens");

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
    refreshToken,
    logoutUser,
    getProfile,
    updateProfile,
};