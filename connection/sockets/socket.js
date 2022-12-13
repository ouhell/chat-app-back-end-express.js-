const server = require("../server/server");

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("user connected : ", socket.id);
  socket.on("private chat", (conversation) => {
    console.log(`socket ${socket.id} joined convo :`, conversation);
    socket.join(conversation);
  });
  socket.on("send message", (message) => {
    console.log(`received message :`, message);
    socket.in(message.conversation).emit("receive message", message);
  });
});

module.exports = io;
