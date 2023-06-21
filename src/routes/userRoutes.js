const express = require("express");
const userController = require("../controllers/userController");
const validationController = require("../controllers/validationController");
const ErrorCatcher = require("../error/ErrorCatcher");

const router = express.Router();

router.param("id",validationController.validateId);

//router.route("/:id").get(userController.getUserById);
router.route("/contacts").get(ErrorCatcher(userController.getContacts));
router
  .route("/contacts/:id")
  .post(ErrorCatcher(userController.addContact))
  .delete(ErrorCatcher(userController.deleteContact));
router
  .route("/contacts/:id/blacklist")
  .patch(ErrorCatcher(userController.blacklistUser));
router
  .route("/contacts/:id/block")
  .patch(ErrorCatcher(userController.blockContact));
router
  .route("/contacts/:id/unblock")
  .patch(ErrorCatcher(userController.unblockContact));
router
  .route("/conversations/public")
  .get(ErrorCatcher(userController.getPublicConversations));
router.route("/requests").get(ErrorCatcher(userController.getContactRequests));
router
  .route("/requests/:id")
  .delete(ErrorCatcher(userController.deleteContactRequest))
  .post(ErrorCatcher(userController.addContactRequest));

router
  .route("/candidates/contacts")
  .get(ErrorCatcher(userController.getContactCandidates));
router
  .route("/profile")
  .get(ErrorCatcher(userController.getSelfProfile))
  .patch(ErrorCatcher(userController.updateProfile));
router
  .route("/profile/picture")
  .put(
    ErrorCatcher(userController.profilePictureFileCatch),
    ErrorCatcher(userController.updateProfilePicture)
  );
router.route("/profile/:id").get(ErrorCatcher(userController.getUserProfile));
router
  .route("/profile/:id/contact")
  .get(ErrorCatcher(userController.getContactProfileByConversationId));

module.exports = router;
