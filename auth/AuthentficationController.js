const express = require("express");
const UserModel = require("../schema/user/UserModel");
const jwt = require("jsonwebtoken");
const ApiError = require("../error/ApiError");

const AuthentificationController = express.Router();

AuthentificationController.post("/login", async (req, res, next) => {
  const identifier = req.body.identifier; // username or email
  const password = req.body.password;
  const user = await UserModel.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  // if user with given username or email does not exist in the database
  if (!user) {
    next(ApiError.unauthorized(`user  "${identifier}" not found`));
    return;
  }
  // if password does not match
  if (user.password !== password) {
    next(ApiError.unauthorized(`incorrect password`));
    return;
  }

  access_token = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET);

  res.status(200).json({ access_token });
});

AuthentificationController;

module.exports = AuthentificationController;
