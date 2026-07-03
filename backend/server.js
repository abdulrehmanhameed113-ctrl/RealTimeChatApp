const dotenv = require("dotenv");
dotenv.config();

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log("API Secret:", process.env.CLOUDINARY_API_SECRET);

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initializeSocket } = require("./src/lib/socket");

connectDB();

const server = initializeSocket(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});