import express from "express";
import {
  getConversationMessages,
  addTextMessage,
  deleteMessage,
  imageMessageFileCatch,
  addImageMessage,
  voiceMessageFileCatch,
  addVoiceMessage,
} from "../controllers/messageController";
import { validateId } from "../controllers/validationController";
import ErrorCatcher from "../error/ErrorCatcher";
const MessageRouter = express.Router();

MessageRouter.param("id", validateId);

MessageRouter.route("/:id")
  .get(ErrorCatcher(getConversationMessages))
  .post(ErrorCatcher(addTextMessage))
  .delete(ErrorCatcher(deleteMessage));
MessageRouter.route("/:id/image").post(
  ErrorCatcher(imageMessageFileCatch),
  ErrorCatcher(addImageMessage)
);
MessageRouter.route("/:id/voice").post(
  ErrorCatcher(voiceMessageFileCatch),
  ErrorCatcher(addVoiceMessage)
);

export default MessageRouter;
