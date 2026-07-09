const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },

        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            default: null,
        },

        text: {
            type: String,
            trim: true,
            default: "",
        },

        image: {
            type: String,
            default: "",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;