const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "No token provided",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password -refreshTokens");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        req.user = user;

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
                code: "TOKEN_EXPIRED",
            });
        }
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};

module.exports = protect;