const express = require("express");
const UserModel = require("../../schema/user/UserModel");
const UserController = express.Router();
const ErrorCatcher = require("../../error/ErrorCatcher");

UserController.get("/users", async (req, res) => {
  res.status(200).json(await UserModel.find());
});

UserController.post(
  "/users",
  ErrorCatcher(async (req, res) => {
    const sentUserData = req.body;

    const newUser = await UserModel.create(sentUserData);
    res.status(200).json(newUser);
  })
);

module.exports = UserController;
