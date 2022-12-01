const express = require("express");
const UserModel = require("../../schema/user/UserModel");
const jwt = require("jsonwebtoken");
const ApiError = require("../../error/ApiError");

const GeneralController = express.Router();

module.exports = GeneralController;
