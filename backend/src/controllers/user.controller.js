const User = require("../models/user.model");

const getUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const users = await User.find({
            _id: { $ne: loggedInUserId },
        }).select("-password");

        res.status(200).json(users);

    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

module.exports = {
    getUsers,
};