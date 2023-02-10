const express = require("express");
const mongoose = require("mongoose");
const MessageModel = require("../../schema/message/MessageModel");
const ConversationModel = require("../../schema/message/ConversationModel");
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
  "/messages/:conversation_id",
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;
    const user_id = req.userInfo._id;
    const message = req.body.message;

    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid coversation"));

    if (
      !(typeof message === "string" || message instanceof String) ||
      !message.trim()
    )
      return next(ApiError.badRequest("invalid message"));

    const conversation = await ConversationModel.exists({
      _id: conversation_id,
      users: user_id,
    });
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

MessageController.delete("/messages/:message_id", async (req, res, next) => {
  let message_id = req.params.message_id;
  const userId = req.userInfo._id;

  if (!mongoose.Types.ObjectId.isValid(message_id)) {
    return next(ApiError.badRequest("invalid message id"));
  }
  message_id = new mongoose.Types.ObjectId(message_id.toString());
  const message = await MessageModel.findById(message_id);
  if (!message) return next(ApiError.notFound("message does not exist"));
  if (message.sender.toString() !== userId)
    return next(ApiError.forbidden("cant delete other users message"));

  message.hidden = true;
  await message.save();
  return res.sendStatus(202);
});

MessageController.get(
  "/messages/:conversation_id",
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;
    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation"));

    const userId = req.userInfo._id;
    const conversation = await ConversationModel.findById(conversation_id);

    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    if (!conversation.users.find((user) => user._id.toString() === userId))
      return next(ApiError.forbidden("invalid contact"));

    const messages = await MessageModel.aggregate([
      {
        $match: {
          conversation: new mongoose.Types.ObjectId(conversation_id),
          hidden: false,
        },
      },
      { $sort: { sent_date: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          localField: "sender",
          foreignField: "_id",
          from: "users",
          as: "sender",
        },
      },
      { $unwind: "$sender" },
      {
        $project: {
          _id: 1,
          conversation: 1,
          message: 1,
          content_type: 1,
          content: 1,
          sent_date: 1,
          "sender._id": 1,
          "sender.username": 1,
          "sender.personal_name": 1,
          "sender.profile_picture": 1,
        },
      },
    ]);
    messages.reverse();
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
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;

    const user_id = req.userInfo._id;
    const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];

    if (!req.files) return next(ApiError.badRequest("no file"));
    const file = req.files.file;
    if (!file) return next(ApiError.badRequest("no file"));

    if (!acceptedImageTypes.includes(file.mimetype))
      return next(ApiError.badRequest("only accept .png .jpg .gif"));

    const metadata = {
      contentType: file.mimetype,
    };

    const conversation = await ConversationModel.exists({
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
  })
);

MessageController.post(
  "/voice/:conversation_id",
  fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 * 5 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 5 megabytes")
      );
    },
  }),
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;
    const user_id = req.userInfo._id;
    const acceptedAudioTypes = ["audio/mp3", "audio/webm"];

    if (!req.files) return next(ApiError.badRequest("no file"));
    const file = req.files.voice;
    if (!file) return next(ApiError.badRequest("no file"));

    if (!acceptedAudioTypes.includes(file.mimetype))
      return next(ApiError.badRequest("only accept mp3"));

    const metadata = {
      contentType: file.mimetype,
    };

    const conversation = await ConversationModel.exists({
      _id: conversation_id,
      users: user_id,
    });

    if (!conversation) return next(ApiError.notFound("can't find coversation"));

    const fileRef = ref(
      storage,
      "audio/" + v4() + "." + file.mimetype.substr(6)
    );

    // let url = null;

    await uploadBytes(fileRef, file.data, metadata);

    url = await getDownloadURL(fileRef);

    try {
      const createdMessage = await MessageModel.create({
        sender: user_id,
        conversation: new mongoose.Types.ObjectId(conversation_id),
        content: url,
        content_type: "voice",
      });

      return res.status(201).json(createdMessage);
    } catch (err) {
      deleteObject(fileRef);
      next(ApiError.internal("couldnt send message"));
    }
  })
);

MessageController.get("/public/conversations", async (req, res, next) => {
  const publicConversations = await ConversationModel.find({
    identifier: "public",
  });
  return res.status(200).json(publicConversations);
});

MessageController.get(
  "/public/messages/:conversation_id",
  ErrorCatcher(async (req, res, next) => {
    const conversation_id = req.params.conversation_id;

    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation id"));

    const conversation_object_id = new mongoose.Types.ObjectId(conversation_id);

    const publicConversationExists = await ConversationModel.exists({
      _id: conversation_object_id,
      identifier: "public",
    });

    if (!publicConversationExists)
      return next(ApiError.notFound("conversation doesn't exist"));

    const messages = await MessageModel.aggregate([
      {
        $match: {
          conversation: conversation_object_id,
          hidden: false,
        },
      },
      { $sort: { sent_date: -1 } },
      { $limit: 30 },
      {
        $lookup: {
          localField: "sender",
          foreignField: "_id",
          from: "users",
          as: "sender",
        },
      },
      { $unwind: "$sender" },
      {
        $project: {
          _id: 1,
          conversation: 1,
          message: 1,
          content_type: 1,
          content: 1,
          sent_date: 1,
          "sender._id": 1,
          "sender.username": 1,
          "sender.personal_name": 1,
          "sender.profile_picture": 1,
        },
      },
    ]);
    messages.reverse();
    res.status(200).json(messages);
  })
);

MessageController.post(
  "/public/messages/:conversation_id",
  ErrorCatcher(async (req, res, next) => {
    const user_id = req.userInfo._id;
    const conversation_id = req.params.conversation_id;
    const message = req.body.message;

    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation id"));

    const conversation_object_id = new mongoose.Types.ObjectId(conversation_id);

    const publicConversationExists = await ConversationModel.exists({
      _id: conversation_object_id,
      identifier: "public",
    });

    if (!publicConversationExists)
      return next(ApiError.notFound("cant find public conversation"));

    if (
      !(typeof message === "string" || message instanceof String) ||
      !message.trim()
    )
      return next(ApiError.badRequest("invalid message"));

    const newMessage = {
      sender: user_id,
      message: message,
      conversation: conversation_object_id,
      content_type: "text",
    };

    const createdMessage = await MessageModel.create(newMessage);

    res.status(201).json(createdMessage);
  })
);

MessageController.post(
  "/public/image/:conversation_id",
  fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 1 megabytes")
      );
    },
  }),
  ErrorCatcher(async (req, res, next) => {
    const user_id = req.userInfo._id;
    const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
    const conversation_id = req.params.conversation_id;

    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation id"));

    const conversation_object_id = new mongoose.Types.ObjectId(conversation_id);

    if (!req.files) return next(ApiError.badRequest("no file"));
    const file = req.files.file;
    if (!file) return next(ApiError.badRequest("no file"));

    if (!acceptedImageTypes.includes(file.mimetype))
      return next(ApiError.badRequest("only accept .png .jpg .gif"));

    const metadata = {
      contentType: file.mimetype,
    };

    const fileRef = ref(storage, "images/" + v4());

    let url = null;

    await uploadBytes(fileRef, file.data, metadata);

    url = await getDownloadURL(fileRef);

    try {
      const createdMessage = await MessageModel.create({
        sender: user_id,
        content: url,
        content_type: "image",
        conversation: conversation_object_id,
      });

      return res.status(201).json(createdMessage);
    } catch (err) {
      deleteObject(fileRef);
      next(ApiError.internal("couldnt send message"));
    }
  })
);

MessageController.post(
  "/public/voice/:conversation_id",
  fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 * 5 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 5 megabytes")
      );
    },
  }),
  ErrorCatcher(async (req, res, next) => {
    const user_id = req.userInfo._id;
    const acceptedAudioTypes = ["audio/mp3", "audio/webm"];
    const conversation_id = req.params.conversation_id;

    if (!mongoose.Types.ObjectId.isValid(conversation_id))
      return next(ApiError.badRequest("invalid conversation id"));

    const conversation_object_id = new mongoose.Types.ObjectId(conversation_id);

    if (!req.files) return next(ApiError.badRequest("no file"));
    const file = req.files.voice;
    if (!file) return next(ApiError.badRequest("no file"));

    if (!acceptedAudioTypes.includes(file.mimetype))
      return next(ApiError.badRequest("only accept mp3"));

    const metadata = {
      contentType: file.mimetype,
    };

    const fileRef = ref(
      storage,
      "audio/" + v4() + "." + file.mimetype.substr(6)
    );

    // let url = null;

    await uploadBytes(fileRef, file.data, metadata);

    url = await getDownloadURL(fileRef);

    try {
      const createdMessage = await MessageModel.create({
        sender: user_id,
        content: url,
        content_type: "voice",
        conversation: conversation_object_id,
      });

      return res.status(201).json(createdMessage);
    } catch (err) {
      deleteObject(fileRef);
      next(ApiError.internal("couldnt send message"));
    }
  })
);

module.exports = MessageController;
