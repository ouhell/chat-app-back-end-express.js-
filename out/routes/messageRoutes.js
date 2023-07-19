"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const messageController_1 = require("../controllers/messageController");
const validationController_1 = require("../controllers/validationController");
const ErrorCatcher_1 = __importDefault(require("../error/ErrorCatcher"));
const MessageRouter = express_1.default.Router();
MessageRouter.param("id", validationController_1.validateId);
MessageRouter.route("/:id")
    .get((0, ErrorCatcher_1.default)(messageController_1.getConversationMessages))
    .post((0, ErrorCatcher_1.default)(messageController_1.addTextMessage))
    .delete((0, ErrorCatcher_1.default)(messageController_1.deleteMessage));
MessageRouter.route("/:id/image").post((0, ErrorCatcher_1.default)(messageController_1.imageMessageFileCatch), (0, ErrorCatcher_1.default)(messageController_1.addImageMessage));
MessageRouter.route("/:id/voice").post((0, ErrorCatcher_1.default)(messageController_1.voiceMessageFileCatch), (0, ErrorCatcher_1.default)(messageController_1.addVoiceMessage));
exports.default = MessageRouter;
