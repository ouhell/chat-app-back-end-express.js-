import express from "express";
import {
  login,
  signup,
  checkEmailExistance,
  checkUsernameExistance,
} from "../controllers/authenticationController";
import ErrorCatcher from "../error/ErrorCatcher";
const AuthenticationRouter = express.Router();
ErrorCatcher;
AuthenticationRouter.route("/login").post(login);
AuthenticationRouter.route("/signup").post(ErrorCatcher(signup));
AuthenticationRouter.route("/check/email/:value").get(
  ErrorCatcher(checkEmailExistance)
);
AuthenticationRouter.route("/check/username/:value").get(
  ErrorCatcher(checkUsernameExistance)
);

export default AuthenticationRouter;
