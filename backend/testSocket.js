const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
    query: {
      userId: "6a46392ca40db1266198b7fc",
    },
});

socket.on("connect", () => {
    console.log("Connected:", socket.id);
});

socket.on("newMessage", (message) => {
    console.log(" New Message Received:");
    console.log(message);
});