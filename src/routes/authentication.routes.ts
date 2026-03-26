import express from "express";
import { AuthenticationController } from "../controllers/authentication.controller";

const AuthController = new AuthenticationController();

const router = express.Router();

router.route("/login").post(AuthController.login);
router.route("/login/oauth/google").post(AuthController.oauthLogin);
router.route("/logout").post(AuthController.logout);
router.route("/signup").post(AuthController.signup);
router.route("/check/email/:value").get(AuthController.checkEmailExistance);
router
  .route("/check/username/:value")
  .get(AuthController.checkUsernameExistance);

router.route("/refresh").post(AuthController.refreshToken);

export default router;
