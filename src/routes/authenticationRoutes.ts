import express from "express";
import {
  login,
  signup,
  checkEmailExistance,
  checkUsernameExistance,
  oauthLogin,
  refreshToken,
  logout,
} from "../controllers/authenticationController";
import ErrorCatcher from "../error/ErrorCatcher";
const AuthenticationRouter = express.Router();
ErrorCatcher;
AuthenticationRouter.route("/login").post(ErrorCatcher(login));
AuthenticationRouter.route("/login/oauth/google").post(
  ErrorCatcher(oauthLogin),
);
AuthenticationRouter.route("/logout").post(ErrorCatcher(logout));
AuthenticationRouter.route("/signup").post(ErrorCatcher(signup));
AuthenticationRouter.route("/check/email/:value").get(
  ErrorCatcher(checkEmailExistance),
);
AuthenticationRouter.route("/check/username/:value").get(
  ErrorCatcher(checkUsernameExistance),
);

AuthenticationRouter.route("/refresh").post(ErrorCatcher(refreshToken));

export default AuthenticationRouter;
