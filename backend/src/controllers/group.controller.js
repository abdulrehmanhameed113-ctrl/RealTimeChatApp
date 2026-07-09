const Group = require("../models/group.model");

const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const creatorId = req.user._id;

        if (!name) {
            return res.status(400).json({ message: "Group name is required" });
        }

        const newGroup = await Group.create({
            name,
            description: description || "",
            creator: creatorId,
            members: [creatorId],
        });

        const populatedGroup = await Group.findById(newGroup._id)
            .populate("creator", "name email profilePic")
            .populate("members", "name email profilePic");

        res.status(201).json({
            message: "Group created successfully",
            group: populatedGroup,
        });

    } catch (error) {
        console.error("Error in createGroup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const getGroups = async (req, res) => {
    try {
        const groups = await Group.find()
            .populate("creator", "name email profilePic")
            .populate("members", "name email profilePic")
            .sort({ createdAt: -1 });

        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getGroups:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const joinGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.members.includes(userId)) {
            return res.status(400).json({ message: "You are already a member of this group" });
        }

        group.members.push(userId);
        await group.save();

        const populatedGroup = await Group.findById(groupId)
            .populate("creator", "name email profilePic")
            .populate("members", "name email profilePic");

        res.status(200).json({
            message: "Joined group successfully",
            group: populatedGroup,
        });

    } catch (error) {
        console.error("Error in joinGroup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const leaveGroup = async (req, res) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        if (!group.members.includes(userId)) {
            return res.status(400).json({ message: "You are not a member of this group" });
        }

        group.members = group.members.filter((m) => m.toString() !== userId.toString());

        if (group.members.length === 0) {
            await Group.findByIdAndDelete(groupId);
            return res.status(200).json({
                message: "Left group successfully. Group deleted as there are no members left.",
                groupId,
            });
        }

        await group.save();

        const populatedGroup = await Group.findById(groupId)
            .populate("creator", "name email profilePic")
            .populate("members", "name email profilePic");

        res.status(200).json({
            message: "Left group successfully",
            group: populatedGroup,
        });

    } catch (error) {
        console.error("Error in leaveGroup:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    createGroup,
    getGroups,
    joinGroup,
    leaveGroup,
};
