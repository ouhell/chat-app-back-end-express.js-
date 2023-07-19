"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const validationController_1 = require("../controllers/validationController");
const ErrorCatcher_1 = __importDefault(require("../error/ErrorCatcher"));
const UserRouter = express_1.default.Router();
UserRouter.param("id", validationController_1.validateId);
//UserRouter.route("/:id").get(getUserById);
UserRouter.route("/contacts").get((0, ErrorCatcher_1.default)(userController_1.getContacts));
UserRouter.route("/contacts/:id")
    .post((0, ErrorCatcher_1.default)(userController_1.addContact))
    .delete((0, ErrorCatcher_1.default)(userController_1.deleteContact));
UserRouter.route("/contacts/:id/blacklist").patch((0, ErrorCatcher_1.default)(userController_1.blacklistUser));
UserRouter.route("/contacts/:id/block").patch((0, ErrorCatcher_1.default)(userController_1.blockContact));
UserRouter.route("/contacts/:id/unblock").patch((0, ErrorCatcher_1.default)(userController_1.unblockContact));
UserRouter.route("/conversations/public").get((0, ErrorCatcher_1.default)(userController_1.getPublicConversations));
UserRouter.route("/requests").get((0, ErrorCatcher_1.default)(userController_1.getContactRequests));
UserRouter.route("/requests/:id")
    .delete((0, ErrorCatcher_1.default)(userController_1.deleteContactRequest))
    .post((0, ErrorCatcher_1.default)(userController_1.addContactRequest));
UserRouter.route("/candidates/contacts").get((0, ErrorCatcher_1.default)(userController_1.getContactCandidates));
UserRouter.route("/profile")
    .get((0, ErrorCatcher_1.default)(userController_1.getSelfProfile))
    .patch((0, ErrorCatcher_1.default)(userController_1.updateProfile));
UserRouter.route("/profile/picture").put((0, ErrorCatcher_1.default)(userController_1.profilePictureFileCatch), (0, ErrorCatcher_1.default)(userController_1.updateProfilePicture));
UserRouter.route("/profile/:id").get((0, ErrorCatcher_1.default)(userController_1.getUserProfile));
UserRouter.route("/profile/:id/contact").get((0, ErrorCatcher_1.default)(userController_1.getContactProfileByConversationId));
exports.default = UserRouter;
