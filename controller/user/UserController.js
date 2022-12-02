const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("../../schema/user/UserModel");
const UserController = express.Router();
const ErrorCatcher = require("../../error/ErrorCatcher");
const ApiError = require("../../error/ApiError");

UserController.get(
  "/users/:id",
  ErrorCatcher(async (req, res) => {
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
  ErrorCatcher(async (req, res) => {
    console.log("user info", req.userInfo);
    const id = req.userInfo.id;
    const user = await UserModel.findById(req.userInfo.id);
    console.log("user : ", user);
    res.status(200).json(await UserModel.find({ _id: { $in: user.contacts } }));
  })
);
UserController.post(
  "/user-contact/:id",
  ErrorCatcher(async (req, res, next) => {
    const postedId = req.params.id;
    // check if id is valid mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(postedId)) {
      return next(ApiError.badRequest("invalid id"));
    }

    const user = new UserModel(await UserModel.findById(req.userInfo.id));

    if (!user) {
      return next(ApiError.forbidden("USER DOES NOT EXIST"));
    }
    //check if contact already exists
    if (checkIfContactExists(user.contacts, postedId)) {
      return next(ApiError.badRequest("contact already exists"));
    }
    user.contacts.push({
      contact_id: postedId,
      conversation: createConversationId(postedId, user.id),
    });
    const newUser = await user.save();
    res.status(200).json(newUser);
  })
);

// does not need authentication
UserController.post(
  "/users",
  ErrorCatcher(async (req, res) => {
    const sentUserData = req.body;

    const newUser = await UserModel.create(sentUserData);
    res.status(200).json(newUser);
  })
);

UserController.delete("/users/:id", async (req, res) => {
  const userId = req.params.id;
  const deletedUser = await UserModel.deleteOne({ _id: userId });
  res.status(200).json(deletedUser);
});

// utility functions

function checkIfContactExists(contacts, id) {
  for (let contact of contacts) {
    if (contact.contact_id === id) return true;
  }
  return false;
}

function createConversationId(id1, id2) {
  if (id1 > id2) {
    return id1 + id2;
  }
  return id2 + id1;
}

module.exports = UserController;
