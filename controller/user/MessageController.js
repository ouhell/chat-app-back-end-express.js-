const express = require("express");
const mongoose = require("mongoose");
const MessageModel = require("../../schema/message/MessageModel");
const CoversationModel = require("../../schema/message/ConversationModel");
const UserModel = require("../../schema/user/UserModel");
const ApiError = require("../../error/ApiError");
const ErrorCatcher = require("../../error/ErrorCatcher");
const fileupload = require("express-fileupload");
const { storage } = require("../../firebase/config");
const {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} = require("firebase/storage");
const { v4 } = require("uuid");

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

    const conversation = await CoversationModel.exists({
      _id: conversation_id,
      users: user_id,
    });
    console.log("conv exists :", conversation);
    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    const createdMessage = await MessageModel.create({
      sender: user_id,
      conversation: conversation_id,
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
    res.status(200).json(messages);
  })
);

MessageController.post(
  "/image/:conversation_id",
  fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 1 megabytes")
      );
    },
  }),
  async (req, res, next) => {
    const conversation_id = req.params.conversation_id;
    const user_id = req.userInfo._id;
    console.log("convo", conversation_id);
    const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];

    if (!req.files) return next(ApiError.badRequest("no file"));
    const file = req.files.file;
    console.log("request file : ", file);
    if (!file) return next(ApiError.badRequest("no file"));

    if (!acceptedImageTypes.includes(file.mimetype))
      return next(ApiError.badRequest("only accept .png .jpg .gif"));

    const metadata = {
      contentType: file.mimetype,
    };

    const conversation = await CoversationModel.exists({
      _id: conversation_id,
      users: user_id,
    });

    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    const fileRef = ref(storage, "images/" + v4());

    let url = null;

    await uploadBytes(fileRef, file.data, metadata);

    url = await getDownloadURL(fileRef);

    try {
      const createdMessage = await MessageModel.create({
        sender: user_id,
        conversation: new mongoose.Types.ObjectId(conversation_id),
        content: url,
        content_type: "image",
      });

      return res.status(201).json(createdMessage);
    } catch (err) {
      deleteObject(fileRef);
      next(ApiError.internal("couldnt send message"));
    }
  }
);

module.exports = MessageController;
