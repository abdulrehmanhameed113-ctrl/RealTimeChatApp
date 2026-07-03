const { z } = require("zod");

const registerSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters long"),
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email("Invalid email format"),
    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required"),
});

module.exports = {
    registerSchema,
    loginSchema,
};
