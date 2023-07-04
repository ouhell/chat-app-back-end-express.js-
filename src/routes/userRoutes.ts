import express from "express";
import {
  getContacts,
  addContact,
  deleteContact,
  blacklistUser,
  blockContact,
  unblockContact,
  getPublicConversations,
  deleteContactRequest,
  addContactRequest,
  getContactCandidates,
  getContactProfileByConversationId,
  getContactRequests,
  getSelfProfile,
  getUserById,
  getUserProfile,
  profilePictureFileCatch,
  updateProfile,
  updateProfilePicture,
} from "../controllers/userController";
import { validateId } from "../controllers/validationController";
import ErrorCatcher from "../error/ErrorCatcher";

const UserRouter = express.Router();

UserRouter.param("id", validateId);

//UserRouter.route("/:id").get(getUserById);
UserRouter.route("/contacts").get(ErrorCatcher(getContacts));
UserRouter.route("/contacts/:id")
  .post(ErrorCatcher(addContact))
  .delete(ErrorCatcher(deleteContact));
UserRouter.route("/contacts/:id/blacklist").patch(ErrorCatcher(blacklistUser));
UserRouter.route("/contacts/:id/block").patch(ErrorCatcher(blockContact));
UserRouter.route("/contacts/:id/unblock").patch(ErrorCatcher(unblockContact));
UserRouter.route("/conversations/public").get(
  ErrorCatcher(getPublicConversations)
);
UserRouter.route("/requests").get(ErrorCatcher(getContactRequests));
UserRouter.route("/requests/:id")
  .delete(ErrorCatcher(deleteContactRequest))
  .post(ErrorCatcher(addContactRequest));

UserRouter.route("/candidates/contacts").get(
  ErrorCatcher(getContactCandidates)
);
UserRouter.route("/profile")
  .get(ErrorCatcher(getSelfProfile))
  .patch(ErrorCatcher(updateProfile));
UserRouter.route("/profile/picture").put(
  ErrorCatcher(profilePictureFileCatch),
  ErrorCatcher(updateProfilePicture)
);
UserRouter.route("/profile/:id").get(ErrorCatcher(getUserProfile));
UserRouter.route("/profile/:id/contact").get(
  ErrorCatcher(getContactProfileByConversationId)
);

export default UserRouter;
