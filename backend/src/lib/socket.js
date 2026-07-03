const { Server } = require("socket.io");
const http = require("http");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

let io;


const userSocketMap = {};

const initializeSocket = (app) => {
    const server = http.createServer(app);

    io = new Server(server, {
        cors: {
            origin: "*",
        },
    });

    io.on("connection", async (socket) => {
        console.log("Handshake Query:", socket.handshake.query);
        console.log("Handshake Auth:", socket.handshake.auth);
        console.log("User Connected:", socket.id);

        let userId = socket.handshake.query.userId;
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.userId;
            } catch (err) {
                console.error("Socket JWT authentication failed:", err.message);
            }
        }

        if (userId) {
            if (!userSocketMap[userId]) {
                userSocketMap[userId] = new Set();
                // Mark user as online in DB
                try {
                    await User.findByIdAndUpdate(userId, { isOnline: true });
                    console.log(`User ${userId} marked online in DB`);
                } catch (error) {
                    console.error("Error setting user online in DB:", error);
                }
            }
            userSocketMap[userId].add(socket.id);
        }

        // Broadcast active online users to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        console.log("Current Online Users:", Object.keys(userSocketMap));

        socket.on("disconnect", async () => {
            console.log("User Disconnected:", socket.id);

            if (userId && userSocketMap[userId]) {
                userSocketMap[userId].delete(socket.id);
                if (userSocketMap[userId].size === 0) {
                    delete userSocketMap[userId];
                    // Mark user as offline in DB
                    try {
                        await User.findByIdAndUpdate(userId, { isOnline: false });
                        console.log(`User ${userId} marked offline in DB`);
                    } catch (error) {
                        console.error("Error setting user offline in DB:", error);
                    }
                }
            }

            io.emit("getOnlineUsers", Object.keys(userSocketMap));
            console.log("Current Online Users after disconnect:", Object.keys(userSocketMap));
        });
    });

    return server;
};

const getReceiverSocketIds = (userId) => {
    return userSocketMap[userId] ? Array.from(userSocketMap[userId]) : [];
};

const getReceiverSocketId = (userId) => {
    return userSocketMap[userId] && userSocketMap[userId].size > 0
        ? Array.from(userSocketMap[userId])[0]
        : undefined;
};

module.exports = {
    initializeSocket,
    getReceiverSocketIds,
    getReceiverSocketId,
    getIO: () => io,
};