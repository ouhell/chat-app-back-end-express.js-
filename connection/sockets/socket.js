const server = require("../server/server");

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("private chat", (conversation) => {
    socket.join(conversation);
  });
  socket.on("send message", (message) => {
    // console.log("message broadcasted :", message.message);
    socket.in(message.conversation).emit("receive message", message);
  });
});

module.exports = io;
