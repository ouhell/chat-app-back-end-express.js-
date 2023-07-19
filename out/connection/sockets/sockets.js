"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("../server/server"));
const socket_io_1 = require("socket.io");
const io = new socket_io_1.Server(server_1.default, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        // transports: ["websocket", "polling"],
        credentials: true,
    },
    allowEIO3: true,
});
io.on("connection", (socket) => {
    socket.on("self connect", (userId) => {
        socket.join(userId);
    });
    socket.on("block", (data) => {
        console.log("blocking socket ", data);
        socket.in(data.conversationId).emit("user blocked", data.conversationId);
    });
    socket.on("unblock", (data) => {
        socket
            .in(data.conversationId)
            .in(data.targetUserId)
            .emit("user unblocked", data.conversationId, data.targetUserId);
    });
    socket.on("send request", (request) => {
        socket.in(request.destinator._id).emit("receive request", request);
        socket.in(request.requester._id).emit("receive request", request);
    });
    socket.on("cancel request", (request) => {
        socket.in(request.destinator._id).emit("canceled request", request._id);
        socket.in(request.requester._id).emit("canceled request", request._id);
    });
    socket.on("accept request", (request) => {
        socket.in(request.destinator._id).emit("accepted request", request);
        socket.in(request.requester._id).emit("accepted request", request);
    });
    socket.on("remove contact", (conversation_id, remover_id) => {
        socket
            .in(conversation_id)
            .emit("remove contact", conversation_id, remover_id);
    });
    socket.on("chat", (conversation) => {
        socket.join(conversation);
    });
    socket.on("send message", (message) => {
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
exports.default = io;
