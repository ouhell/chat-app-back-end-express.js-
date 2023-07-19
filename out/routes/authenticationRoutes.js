"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticationController_1 = require("../controllers/authenticationController");
const ErrorCatcher_1 = __importDefault(require("../error/ErrorCatcher"));
const AuthenticationRouter = express_1.default.Router();
ErrorCatcher_1.default;
AuthenticationRouter.route("/login").post(authenticationController_1.login);
AuthenticationRouter.route("/signup").post((0, ErrorCatcher_1.default)(authenticationController_1.signup));
AuthenticationRouter.route("/check/email/:value").get((0, ErrorCatcher_1.default)(authenticationController_1.checkEmailExistance));
AuthenticationRouter.route("/check/username/:value").get((0, ErrorCatcher_1.default)(authenticationController_1.checkUsernameExistance));
exports.default = AuthenticationRouter;
