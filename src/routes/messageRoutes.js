const express = require("express");
const messageController = require("../controllers/messageController");
const validationController = require("../controllers/validationController");
const ErrorCatcher = require("../error/ErrorCatcher");
const router = express.Router();

router.param("id", validationController.validateId);

router
  .route("/:id")
  .get(ErrorCatcher(messageController.getConversationMessages))
  .post(ErrorCatcher(messageController.addTextMessage))
  .delete(ErrorCatcher(messageController.deleteMessage));
router
  .route("/:id/image")
  .post(
    ErrorCatcher(messageController.imageMessageFileCatch),
    ErrorCatcher(messageController.addImageMessage)
  );
router
  .route("/:id/voice")
  .post(
    ErrorCatcher(messageController.voiceMessageFileCatch),
    ErrorCatcher(messageController.addVoiceMessage)
  );

module.exports = router;
