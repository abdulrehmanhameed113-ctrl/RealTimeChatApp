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
                try {
                    await User.findByIdAndUpdate(userId, { isOnline: true });
                    console.log(`User ${userId} marked online in DB`);
                } catch (error) {
                    console.error("Error setting user online in DB:", error);
                }
            }
            userSocketMap[userId].add(socket.id);

            // Join all user's groups automatically on connect
            const Group = require("../models/group.model");
            try {
                const userGroups = await Group.find({ members: userId });
                userGroups.forEach((g) => {
                    socket.join(g._id.toString());
                    console.log(`Socket ${socket.id} joined room ${g._id}`);
                });
            } catch (error) {
                console.error("Error joining user groups on socket connect:", error);
            }
        }

        // Broadcast active online users to all clients
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        console.log("Current Online Users:", Object.keys(userSocketMap));

        // Group rooms management
        socket.on("joinGroupRoom", ({ groupId }) => {
            socket.join(groupId);
            console.log(`Socket ${socket.id} dynamically joined group room ${groupId}`);
        });

        socket.on("leaveGroupRoom", ({ groupId }) => {
            socket.leave(groupId);
            console.log(`Socket ${socket.id} dynamically left group room ${groupId}`);
        });

        // Real-time typing indicators
        socket.on("typing", ({ senderId, receiverId, groupId }) => {
            if (groupId) {
                socket.to(groupId).emit("userTyping", { senderId, groupId });
            } else {
                const receiverSocketIds = getReceiverSocketIds(receiverId);
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("userTyping", { senderId });
                });
            }
        });

        socket.on("stopTyping", ({ senderId, receiverId, groupId }) => {
            if (groupId) {
                socket.to(groupId).emit("userStoppedTyping", { senderId, groupId });
            } else {
                const receiverSocketIds = getReceiverSocketIds(receiverId);
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("userStoppedTyping", { senderId });
                });
            }
        });

        socket.on("disconnect", async () => {
            console.log("User Disconnected:", socket.id);

            if (userId && userSocketMap[userId]) {
                userSocketMap[userId].delete(socket.id);
                if (userSocketMap[userId].size === 0) {
                    delete userSocketMap[userId];
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