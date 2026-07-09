const Message = require("../models/message.model");
const Group = require("../models/group.model");
const { getReceiverSocketIds, getIO } = require("../lib/socket");
const { uploadToCloudinary } = require("../utils/cloudinary");

const sendMessage = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { id: receiverId } = req.params;
        const { text, image } = req.body;

        let imageUrl = "";

        // Check if file is uploaded via Multer
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file.buffer, "chat-app-messages");
            imageUrl = uploadResult.secure_url;
        } 
        // Or if base64 image string is passed in request body
        else if (image) {
            const uploadResult = await uploadToCloudinary(image, "chat-app-messages");
            imageUrl = uploadResult.secure_url;
        }

        if (!text && !imageUrl) {
            return res.status(400).json({
                message: "Message must contain either text or an image",
            });
        }

        const isGroupChat = await Group.exists({ _id: receiverId });

        let newMessage;
        if (isGroupChat) {
            newMessage = await Message.create({
                senderId,
                groupId: receiverId,
                text: text || "",
                image: imageUrl,
            });
        } else {
            newMessage = await Message.create({
                senderId,
                receiverId,
                text: text || "",
                image: imageUrl,
            });
        }

        // Populate sender details for UI rendering
        const populatedMessage = await Message.findById(newMessage._id).populate(
            "senderId",
            "name email profilePic"
        );

        const io = getIO();
        if (io) {
            if (isGroupChat) {
                // Send message to everyone joined in the group room
                io.to(receiverId).emit("newMessage", populatedMessage);
            } else {
                // Send to recipient's active socket connections
                const receiverSocketIds = getReceiverSocketIds(receiverId);
                receiverSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("newMessage", populatedMessage);
                });

                // Send to sender's other active socket connections (multi-tab sync)
                const senderSocketIds = getReceiverSocketIds(senderId);
                senderSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("newMessage", populatedMessage);
                });
            }
        }

        res.status(201).json({
            message: "Message sent successfully",
            data: populatedMessage,
        });

    } catch (error) {
        console.error("Error in sendMessage:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const getMessages = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: userToChatId } = req.params;
        const { limit = "20", before } = req.query;
        const parsedLimit = parseInt(limit, 10);

        const isGroupChat = await Group.exists({ _id: userToChatId });

        const query = {};
        if (isGroupChat) {
            query.groupId = userToChatId;
        } else {
            query.$or = [
                {
                    senderId: myId,
                    receiverId: userToChatId,
                },
                {
                    senderId: userToChatId,
                    receiverId: myId,
                },
            ];
        }

        // Pagination: load messages before a certain date/time
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Sort by newest first to slice for limit
            .limit(parsedLimit)
            .populate("senderId", "name email profilePic");

        // Reverse to chronological order (oldest first)
        messages.reverse();

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const myId = req.user._id;
        const { id: senderId } = req.params;

        const isGroupChat = await Group.exists({ _id: senderId });

        if (!isGroupChat) {
            // Mark all messages sent by senderId to myId as read
            await Message.updateMany(
                { senderId, receiverId: myId, isRead: false },
                { $set: { isRead: true } }
            );

            // Notify the sender that their messages have been read
            const io = getIO();
            if (io) {
                const senderSocketIds = getReceiverSocketIds(senderId);
                senderSocketIds.forEach((socketId) => {
                    io.to(socketId).emit("messagesRead", {
                        readBy: myId,
                    });
                });
            }
        }

        res.status(200).json({
            message: "Messages marked as read successfully",
        });

    } catch (error) {
        console.error("Error in markAsRead:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    markAsRead,
};