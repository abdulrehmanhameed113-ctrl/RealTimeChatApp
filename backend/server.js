const dotenv = require("dotenv");
const app = require("./src/app");
const connectDB = require("./src/config/db");

dotenv.config();
console.log(process.cwd());
console.log(process.env);
console.log(process.env.MONGODB_URI);


connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server is running on port ${PORT}`);
});