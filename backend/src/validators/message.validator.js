const { z } = require("zod");

const sendMessageSchema = z.object({
    text: z.string().trim().optional(),
    image: z.string().optional(),
});

module.exports = {
    sendMessageSchema,
};
