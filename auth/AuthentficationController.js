const express = require("express");
const UserModel = require("../schema/user/UserModel");
const jwt = require("jsonwebtoken");
const ApiError = require("../error/ApiError");
const ErrorCatcher = require("../error/ErrorCatcher");
const EncryptionHandler = require("../security/EncryptionHandler");

const AuthentificationController = express.Router();

AuthentificationController.post(
  "/login",
  ErrorCatcher(async (req, res, next) => {
    const identifier = req.body.identifier; // username or email
    const password = req.body.password;
    const user = await UserModel.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    });
    // if user with given username or email does not exist in the database
    if (!user) {
      next(ApiError.unauthorized(`incorrect username`));
      return;
    }
    // if password does not match
    if (EncryptionHandler.decrypt(user.password) !== password) {
      next(ApiError.unauthorized(`incorrect password`));
      return;
    }

    access_token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.status(200).json({
      access_token,
      userId: user._id,
      userRole: user.role,
      username: user.username,
      profile_picture: user.profile_picture,
    });
  })
);

AuthentificationController.get(
  "/usernameExist/:checkUsername",
  ErrorCatcher(async (req, res, next) => {
    const checkUsername = req.params.checkUsername;
    const username = await UserModel.exists({
      username: checkUsername,
    });
    if (username) return res.status(200).json(true);

    return res.status(200).json(false);
  })
);
AuthentificationController.get(
  "/emailExist/:checkEmail",
  ErrorCatcher(async (req, res, next) => {
    const checkEmail = req.params.checkEmail;
    const email = await UserModel.exists({
      email: checkEmail,
    });
    if (email) return res.status(200).json(true);

    return res.status(200).json(false);
  })
);

AuthentificationController.post(
  "/signup",
  ErrorCatcher(async (req, res, next) => {
    let { username, personal_name, password, email } = req.body;
    password = EncryptionHandler.encrypt(password);
    const user = new UserModel({ username, personal_name, password, email });

    const createdUser = await user.save();

    return res.status(201).json(createdUser);
  })
);

AuthentificationController;

module.exports = AuthentificationController;
