import express from "express";
import { MessageController } from "../controllers/message.controller";
import { validateId } from "../controllers/validation.controller";
import ErrorCatcher from "../error/ErrorCatcher";
import { Message } from "../@types/schemas";
const router = express.Router();

const messageController = new MessageController();

router.param("id", validateId);

router
  .route("/:id")
  .get(messageController.getConversationMessages)
  .post(messageController.addTextMessage)
  .delete(messageController.deleteMessage);
router
  .route("/:id/image")
  .post(
    messageController.imageMessageFileCatch,
    messageController.addImageMessage,
  );
router
  .route("/:id/voice")
  .post(
    messageController.voiceMessageFileCatch,
    messageController.addVoiceMessage,
  );

export default router;
