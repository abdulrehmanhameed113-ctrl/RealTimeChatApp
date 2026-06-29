const User = require("../models/user.model");

const registerUser = async (req, res) => {

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required",
        });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        return res.status(400).json({
            message: "User already exists",
        });
    }

    const newUser = await User.create({
        name,
        email,
        password,
    });

    return res.status(201).json({
        message: "User registered successfully",
        user: newUser,
    });
};

module.exports = {
    registerUser,
};