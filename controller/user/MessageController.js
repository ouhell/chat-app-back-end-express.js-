const express = require("express");
const mongoose = require("mongoose");
const MessageModel = require("../../schema/message/MessageModel");
const CoversationModel = require("../../schema/message/ConversationModel");
const UserModel = require("../../schema/user/UserModel");
const ApiError = require("../../error/ApiError");
const ErrorCatcher = require("../../error/ErrorCatcher");

const MessageController = express.Router();

MessageController.post(
  "/messages",
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.body.conversation_id;
    const user_id = req.userInfo._id;
    const message = req.body.message;

    if (
      !(typeof message === "string" || message instanceof String) ||
      !message.trim()
    )
      return next(ApiError.badRequest("invalid message"));
    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid coversation"));

    const userId = req.userInfo._id;
    const conversation = await CoversationModel.findById(conversation_id);

    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    console.log(conversation);

    if (!conversation.users.find((user) => user._id.toString() === user_id))
      return next(ApiError.forbidden("invalid contact"));

    const createdMessage = await MessageModel.create({
      sender: userId,
      conversation: conversation._id,
      message: message,
      content_type: "text",
    });

    res.status(201).json(createdMessage);
  })
);

MessageController.get(
  "/messages/:conversation_id",
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;
    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation"));

    const userId = req.userInfo._id;
    const conversation = await CoversationModel.findById(conversation_id);

    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    if (!conversation.users.find((user) => user._id.toString() === userId))
      return next(ApiError.forbidden("invalid contact"));

    const messages = await MessageModel.where("conversation").equals(
      conversation._id.toString()
    );
    console.log("messages", messages);
    res.status(200).json(messages);
  })
);

module.exports = MessageController;
