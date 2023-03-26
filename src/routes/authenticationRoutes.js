const express = require("express");
const authenticationController = require("../controllers/authenticationController");
const ErrorCatcher = require("../error/ErrorCatcher");
const router = express.Router();
ErrorCatcher;
router.route("/login").post(authenticationController.login);
router.route("/signup").post(ErrorCatcher(authenticationController.signup));
router
  .route("/check/email/:value")
  .get(ErrorCatcher(authenticationController.checkEmailExistance));
router
  .route("/check/username/:value")
  .get(ErrorCatcher(authenticationController.checkUsernameExistance));

module.exports = router;
