const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.routes");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middleware/error.middleware");

const app = express();

console.log("Cloudinary Connected");

// Configure CORS for credentials support (useful in development and production MERN environments)
app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(express.json({ limit: "50mb" })); // Increase JSON payload limit to support large base64 image strings
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to Chat App API",
    });
});

// Global Error Handler (must be registered last)
app.use(errorHandler);

module.exports = app;