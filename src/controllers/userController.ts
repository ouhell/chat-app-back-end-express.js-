import { NextFunction, Response } from "express";
import mongoose, { AnyExpression } from "mongoose";
import MessageModel from "../schema/message/MessageModel";
import ConversationModel from "../schema/message/ConversationModel";
import UserModel from "../schema/user/UserModel";
import ApiError from "../error/ApiError";
//const ErrorCatcher = require("../error/ErrorCatcher");

import RequestModel from "../schema/request/RequestModel";
import { storage } from "../firebase/config";
import { AuthRequest } from "../types/AuthRequest";
import fileUpload from "express-fileupload";
import {
  deleteObject,
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) return ApiError.notFound("user does not exist");
  res.status(200).json();
};

export const getPublicConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const publicConversations = await ConversationModel.find({
    identifier: "public",
  });
  return res.status(200).json(publicConversations);
};

export const getContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const conversations = await ConversationModel.aggregate([
    {
      $match: {
        identifier: { $regex: new RegExp(req.userInfo._id) },
      },
    },
    {
      $unwind: "$users",
    },

    {
      $lookup: {
        from: "users",
        localField: "users",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $match: {
        users: {
          $not: { $eq: new mongoose.Types.ObjectId(req.userInfo._id) },
        },
      },
    },
    {
      $project: {
        _id: 1,
        identifier: 1,
        creation_date: 1,
        "user.username": 1,
        "user.personal_name": 1,
        "user.email": 1,
        "user.profile_picture": 1,
        "user._id": 1,
      },
    },
  ]);

  return res.status(200).json(conversations);
};

export const addContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const postedId = req.params.id;
  const userId = req.userInfo._id;

  //fetch the request
  const request = await RequestModel.findById(postedId);

  // check if request exists
  if (!request) {
    return next(ApiError.forbidden(`request  does not exists`));
  }

  // cant accept request sent to others
  if (userId !== request.destinator.toString())
    return next(ApiError.forbidden("request not destined to user"));

  const requester = await UserModel.findById(request.requester, {
    username: 1,
    personal_name: 1,
    email: 1,
    profile_picture: 1,
    _id: 1,
  });

  if (!requester) {
    RequestModel.deleteOne({
      _id: postedId,
    });
    return next(ApiError.forbidden("USER DOES NOT EXIST"));
  }

  //check if convo already exists
  const convo_indentifier = createConversationId(
    userId,
    request.requester.toString()
  );

  const conversation = await ConversationModel.exists({
    identifier: convo_indentifier,
  });
  if (conversation) {
    RequestModel.deleteOne({
      _id: postedId,
    });
    return next(ApiError.badRequest("contact already in contact list"));
  }

  await RequestModel.deleteOne({
    _id: postedId,
  });

  const newConvo = await ConversationModel.create({
    identifier: convo_indentifier,
    users: [userId, requester._id],
    admins: [userId, requester._id],
  });
  res.status(200).json({ ...newConvo, user: requester });
};

export const deleteContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const contactId = req.params.id;
  const userId = req.userInfo._id;

  //check if convo already exists
  const convo_indentifier = createConversationId(userId, contactId);

  const conversation = await ConversationModel.exists({
    identifier: convo_indentifier,
  });
  if (!conversation) {
    return next(ApiError.badRequest("contact doesn't exist"));
  }

  await ConversationModel.deleteOne({ _id: conversation._id });
  MessageModel.deleteMany({ conversation: conversation._id });
  return res.sendStatus(204);
};

export const blacklistUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const blackListedUserId = req.params.id;
  const userId = req.userInfo._id;

  const user = await UserModel.findById(userId);
  const convo_indentifier = createConversationId(userId, blackListedUserId);
  const conversation = await ConversationModel.exists({
    identifier: convo_indentifier,
  });

  if (!user) {
    return next(new ApiError(404, "user not found"));
  }

  if (conversation) {
    await ConversationModel.deleteOne({ _id: conversation._id });
    MessageModel.deleteMany({ conversation: conversation._id });
  }
  const blockedObjectId = new mongoose.Types.ObjectId(blackListedUserId);
  user.black_listed_users.push(blockedObjectId);
  await user.save();
  return res.sendStatus(200);
};

export const blockContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("blocking");
  const blockedUserId = req.params.id;
  const userId = req.userInfo._id;
  const convo_indentifier = createConversationId(userId, blockedUserId);

  const conversation = await ConversationModel.findOne({
    identifier: convo_indentifier,
  });
  if (!conversation) return next(ApiError.notFound("conversation not found"));
  if (!conversation.admins.find((user) => user._id.toString() === userId))
    return next(ApiError.forbidden("not an admin"));
  if (
    conversation.blocked.find((user) => user._id.toString() === blockedUserId)
  )
    return next(ApiError.forbidden("user already blocked"));

  conversation.blocked.push(new mongoose.Types.ObjectId(blockedUserId));

  await conversation.save();
  return res.sendStatus(200);
};

export const unblockContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const blockedUserId = req.params.id;
  const userId = req.userInfo._id;
  const convo_indentifier = createConversationId(userId, blockedUserId);

  const conversation = await ConversationModel.findOne({
    identifier: convo_indentifier,
  });

  if (!conversation) return next(ApiError.notFound("conversation not found"));
  if (!conversation.admins.find((user) => user.toString() === userId))
    return next(ApiError.forbidden("user is not admin"));
  if (!conversation.blocked.find((user) => user.toString() === blockedUserId))
    return next(ApiError.forbidden("user not blocked"));
  conversation.blocked = conversation.blocked.filter(
    (user) => user._id.toString() !== blockedUserId
  );
  await conversation.save();
  return res.sendStatus(200);
};

export const getContactRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  /* const requests = await RequestModel.find({
    $or: [{ requester: req.userInfo._id }, { destinator: req.userInfo._id }],
  }); */
  const ObjectUserId = new mongoose.Types.ObjectId(req.userInfo._id);
  const requests = await RequestModel.aggregate([
    {
      $match: {
        $or: [{ requester: ObjectUserId }, { destinator: ObjectUserId }],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "requester",
        foreignField: "_id",
        as: "requester",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "destinator",
        foreignField: "_id",
        as: "destinator",
      },
    },
    { $unwind: "$requester" },
    { $unwind: "$destinator" },
    {
      $project: {
        _id: 1,
        "requester._id": 1,
        "requester.username": 1,
        "requester.personal_name": 1,
        "requester.profile_picture": 1,
        "destinator._id": 1,
        "destinator.username": 1,
        "destinator.personal_name": 1,
        "destinator.profile_picture": 1,
      },
    },
  ]);
  return res.status(200).json(requests);
};
export const addContactRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const destinator = req.params.id;
  if (req.userInfo._id === destinator)
    return next(ApiError.badRequest("cant request from self"));

  const destinatorExists = await UserModel.exists({ _id: destinator });
  if (!destinatorExists)
    return next(ApiError.forbidden("destinator does not exists"));

  const contactAlreadyExists = await ConversationModel.exists({
    identifier: createConversationId(req.userInfo._id, destinator),
  });
  if (contactAlreadyExists)
    return next(ApiError.forbidden("contact already exists"));

  const requestAlreadyExists = await RequestModel.exists({
    $or: [
      { requester: req.userInfo._id, destinator: destinator },
      { requester: destinator, destinator: req.userInfo._id },
    ],
  });
  if (requestAlreadyExists)
    return next(ApiError.forbidden("request already exists"));

  const request = await RequestModel.create({
    requester: req.userInfo._id,
    destinator,
  });
  const appendedRequest = await RequestModel.aggregate([
    { $match: { _id: request._id } },
    {
      $lookup: {
        from: "users",
        localField: "requester",
        foreignField: "_id",
        as: "requester",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "destinator",
        foreignField: "_id",
        as: "destinator",
      },
    },
    { $unwind: "$requester" },
    { $unwind: "$destinator" },
    {
      $project: {
        _id: 1,
        "requester._id": 1,
        "requester.username": 1,
        "requester.personal_name": 1,
        "requester.profile_picture": 1,
        "destinator._id": 1,
        "destinator.username": 1,
        "destinator.personal_name": 1,
        "destinator.profile_picture": 1,
      },
    },
  ]);
  return res.status(201).json(appendedRequest[0]);
};
export const deleteContactRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const postedId = req.params.id;

  const request = await RequestModel.findById(postedId);

  if (!request) return next(ApiError.notFound("request does not exists"));

  if (
    request.requester.toString() !== req.userInfo._id &&
    request.destinator.toString() !== req.userInfo._id
  )
    return next(ApiError.forbidden("cant cancel unaffliated request"));

  await RequestModel.deleteOne({
    _id: postedId,
  });

  return res.status(200).json(request);
};
export const getContactCandidates = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const searchtext = req.query.search as string;

  const user = await UserModel.findById(req.userInfo._id);
  if (!user) {
    return next(ApiError.notFound("user not found"));
  }
  const objectUserId = new mongoose.Types.ObjectId(req.userInfo._id);

  const requests = await RequestModel.find({
    $or: [{ requester: req.userInfo._id }, { destinator: req.userInfo._id }],
  });

  // get all users that have a request with current user
  const requested = requests.map((request) => {
    return request.requester.toString() === req.userInfo._id
      ? new mongoose.Types.ObjectId(request.destinator.toString())
      : new mongoose.Types.ObjectId(request.requester.toString());
  });

  const conversations = await ConversationModel.find({
    identifier: { $regex: new RegExp(req.userInfo._id) },
  });

  // get all users in contact with current user
  const contacts = conversations.reduce(
    (contacts: mongoose.Types.ObjectId[], convo) => {
      return contacts.concat(
        convo.users.filter(
          (user) => user._id.toString() !== user._id.toString()
        )
      );
    },
    []
  );
  //   .map((convo) => {
  //     let user = convo.users.find((user) => user.toString() !== req.userInfo._id);
  //     return user;
  //   });

  const filterList = contacts.concat(requested);
  filterList.push(new mongoose.Types.ObjectId(req.userInfo._id));
  filterList.concat(user.black_listed_users);

  const matchQuery: Record<string, AnyExpression> = {
    _id: { $not: { $in: filterList } },
    black_listed_users: { $ne: objectUserId },
  };
  if (searchtext) {
    matchQuery["$or"] = [
      { username: { $regex: new RegExp(searchtext) } },
      { personal_name: { $regex: new RegExp(searchtext) } },
    ];
  }

  const candidates = await UserModel.aggregate([
    { $match: matchQuery },
    { $limit: 10 },
    {
      $project: {
        _id: 1,
        username: 1,
        personal_name: 1,
        email: 1,
        profile_picture: 1,
        black_listed_users: 1,
      },
    },
  ]);

  return res.status(200).json(candidates);
};
export const getSelfProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const objectUserId = new mongoose.Types.ObjectId(req.userInfo._id);
  const profile = await UserModel.aggregate([
    { $match: { _id: objectUserId } },
    {
      $project: {
        username: 1,
        personal_name: 1,
        email: 1,
        profile_picture: 1,
      },
    },
  ]);

  res.status(200).json(profile[0]);
};
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  const objectId = new mongoose.Types.ObjectId(id);
  const profile = await UserModel.aggregate([
    { $match: { _id: objectId } },
    {
      $project: {
        username: 1,
        personal_name: 1,
        profile_picture: 1,
      },
    },
  ]);

  if (profile.length === 0) return next(ApiError.notFound("user not found"));

  res.status(200).json(profile[0]);
};
export const getContactProfileByConversationId = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const conversationId = req.params.id;

  const objectId = new mongoose.Types.ObjectId(conversationId);
  const profile = await ConversationModel.aggregate([
    {
      $match: {
        _id: objectId,
      },
    },
    {
      $unwind: "$users",
    },

    {
      $lookup: {
        from: "users",
        localField: "users",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $match: {
        users: {
          $not: { $eq: new mongoose.Types.ObjectId(req.userInfo._id) },
        },
      },
    },
    {
      $project: {
        _id: 1,
        identifier: 1,
        creation_date: 1,
        "user.username": 1,
        "user.personal_name": 1,
        "user.email": 1,
        "user.profile_picture": 1,
        "user._id": 1,
      },
    },
  ]);

  if (profile.length === 0) return next(ApiError.notFound("user not found"));

  res.status(200).json(profile[0]);
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { username, personal_name, email } = req.body;
  if (!(username && personal_name && email))
    return next(ApiError.badRequest("value not provided"));
  const user = await UserModel.findById(req.userInfo._id);
  if (!user) {
    return next(ApiError.notFound("user not found"));
  }
  user.username = username;
  user.personal_name = personal_name;
  user.email = email;
  const savedUser = await user.save();
  res.status(200).json(savedUser);
};
export const updateProfilePicture = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.files) return next(ApiError.badRequest("no file"));
  const image = req.files.profile_pic as fileUpload.UploadedFile;
  if (!image) return next(ApiError.badRequest("no image"));
  const imageRef = ref(storage, "profile/" + req.userInfo._id);
  const metadata = {
    contentType: image.mimetype,
  };
  await uploadBytes(imageRef, image.data, metadata);
  const url = await getDownloadURL(imageRef);
  await UserModel.findByIdAndUpdate(req.userInfo._id, {
    profile_picture: url,
  });

  return res.status(203).json({
    newUrl: url,
  });
};
export const profilePictureFileCatch = fileUpload({
  limits: { fileSize: 1024 * 1024 * 3 },
  limitHandler: (req, res, next) => {
    return next(ApiError.badRequest("image surpass the size limit of 3mb"));
  },
});

function createConversationId(id1: string, id2: string) {
  if (id1 > id2) {
    return id1 + id2;
  }
  return id2 + id1;
}
