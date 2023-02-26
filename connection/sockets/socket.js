const server = require("../server/server");

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("self connect", (userId) => {
    socket.join(userId);
  });

  socket.on("send request", (request) => {
    socket.in(request.destinator._id).emit("receive request", request);
    socket.in(request.requester._id).emit("receive request", request);
  });

  socket.on("cancel request", (request) => {
    socket.in(request.destinator).emit("canceled request", request._id);
    socket.in(request.requester).emit("canceled request", request._id);
  });
  socket.on("chat", (conversation) => {
    socket.join(conversation);
  });
  socket.on("send message", (message) => {
    // console.log("message broadcasted :", message.message);
    socket.in(message.conversation).emit("receive message", message);
  });
  socket.on("delete message", (message) => {
    socket.in(message.conversation).emit("remove message", message);
  });
  socket.on("notify request", (request) => {
    socket.in(request.destinator).emit("receive request", request);
  });
  socket;
});

module.exports = io;
