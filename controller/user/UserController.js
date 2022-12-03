const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("../../schema/user/UserModel");
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
    const user = await UserModel.findById(req.userInfo._id);
    if (!user)
      return next(ApiError.forbidden("requesting user does not exist"));
    res.status(200).json(
      await UserModel.find({
        _id: { $in: user.contacts.map((contact) => contact.contact_id) },
      })
    );
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
    console.log("jwt stored info : ", req.userInfo);
    console.log("filtering id : ", req.userInfo._id);
    const user = new UserModel(await UserModel.findById(req.userInfo._id));
    console.log("fetched user : ", user);
    return next("lmao");
    /* if (!user) {
      return next(ApiError.forbidden("USER DOES NOT EXIST"));
    }
    //check if contact already exists
    if (checkIfContactExists(user.contacts, postedId)) {
      return next(ApiError.badRequest("contact already exists"));
    }
    user.contacts.push({
      contact_id: postedId,
    });
    const newUser = await user.save();
    res.status(200).json(newUser); */
  })
);

// does not need authentication
UserController.post(
  "/users",
  ErrorCatcher(async (req, res, next) => {
    const sentUserData = req.body;
    if (!sentUserData) return next(ApiError.badRequest("no data"));
    if (!validatePassword(sentUserData.password))
      return next(
        ApiError.badRequest("password must be longer than 8 characters")
      );
    sentUserData.password = EncryptionHandler.encrypt(sentUserData.password);

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

function validatePassword(password) {
  console.log(password, password.length);
  if (!password || !password instanceof String || password.length < 8)
    return false;
  return true;
}

module.exports = UserController;
