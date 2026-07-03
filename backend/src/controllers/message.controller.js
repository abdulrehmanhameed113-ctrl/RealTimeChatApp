const Message = require("../models/message.model");
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

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: text || "",
            image: imageUrl,
        });

        const io = getIO();
        if (io) {
            // Send to recipient's active socket connections
            const receiverSocketIds = getReceiverSocketIds(receiverId);
            receiverSocketIds.forEach((socketId) => {
                io.to(socketId).emit("newMessage", newMessage);
            });

            // Send to sender's other active socket connections (multi-tab sync)
            const senderSocketIds = getReceiverSocketIds(senderId);
            senderSocketIds.forEach((socketId) => {
                io.to(socketId).emit("newMessage", newMessage);
            });
        }

        res.status(201).json({
            message: "Message sent successfully",
            data: newMessage,
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

        const messages = await Message.find({
            $or: [
                {
                    senderId: myId,
                    receiverId: userToChatId,
                },
                {
                    senderId: userToChatId,
                    receiverId: myId,
                },
            ],
        }).sort({ createdAt: 1 }); 

        res.status(200).json(messages);

    } catch (error) {
        console.error("Error in getMessages:", error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    sendMessage,
    getMessages,
};