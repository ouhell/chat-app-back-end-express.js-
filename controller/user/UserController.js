const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("../../schema/user/UserModel");
const ConversationModel = require("../../schema/message/ConversationModel");
const UserController = express.Router();
const ErrorCatcher = require("../../error/ErrorCatcher");
const ApiError = require("../../error/ApiError");
const EncryptionHandler = require("../../security/EncryptionHandler");

UserController.get(
  "/users/:id",
  ErrorCatcher(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return next(ApiError.forbidden("invalid id"));
    res.status(200).json(await UserModel.findById(req.params.id));
  })
);
UserController.get(
  "/users",
  ErrorCatcher(async (req, res) => {
    res.status(200).json(await UserModel.find());
  })
);

UserController.get(
  "/user-contact",
  ErrorCatcher(async (req, res, next) => {
    console.log(req.userInfo._id);
    const conversations = await ConversationModel.find({
      identifier: { $regex: new RegExp(req.userInfo._id) },
    });
    console.log("conversations : ", conversations);
    const filteredList = conversations.reduce((reduced, convo, i) => {
      console.log("reduced : ", i, " : ", reduced);
      let { _id, username, personal_name } = convo.users.find(
        (user) => user._id.toString() !== req.userInfo._id
      );

      reduced.push({
        _id,
        username,
        personal_name,
        conversation_id: convo._id,
      });
      return reduced;
    }, []);
    res.status(200).json(filteredList);
  })
);
UserController.post(
  "/user-contact/:id",
  ErrorCatcher(async (req, res, next) => {
    const postedId = req.params.id;
    // check if id is valid mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(postedId)) {
      return next(ApiError.badRequest("invalid contact id"));
    }

    const user = await UserModel.findById(req.userInfo._id);
    const contact = await UserModel.findById(postedId);

    if (!user) {
      return next(ApiError.forbidden("USER DOES NOT EXIST"));
    }
    if (!contact) {
      return next(
        ApiError.forbidden(`Contact with id ${postedId} does not exists`)
      );
    }
    //check if convo already exists
    const convo_indentifier = createConversationId(user._id, contact._id);
    const conversation = await ConversationModel.findOne({
      identifier: convo_indentifier,
    });
    if (conversation) {
      return next(ApiError.badRequest("contact already in contact list"));
    }

    const newConvo = await ConversationModel.create({
      identifier: convo_indentifier,
      users: [
        {
          _id: user._id,
          username: user.username,
          personal_name: user.personal_name,
        },
        {
          _id: contact._id,
          username: contact.username,
          personal_name: contact.personal_name,
        },
      ],
    });
    res.status(200).json(newConvo);
  })
);

// does not need authentication

// utility functions

function createConversationId(id1, id2) {
  if (id1 > id2) {
    return id1 + id2;
  }
  return id2 + id1;
}

function validatePassword(password) {
  console.log(password, password.length);
  if (!password || !password instanceof String || password.length < 8)
    return false;
  return true;
}

module.exports = UserController;
