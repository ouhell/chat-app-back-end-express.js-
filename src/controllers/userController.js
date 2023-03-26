const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("../schema/user/UserModel");
const ConversationModel = require("../schema/message/ConversationModel");
const RequestModel = require("../schema/request/RequestModel");
const MessageModel = require("../schema/message/MessageModel");
const ErrorCatcher = require("../error/ErrorCatcher");
const ApiError = require("../error/ApiError");

const fileUpload = require("express-fileupload");
const { storage } = require("../firebase/config");
const {
  deleteObject,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");
const { async } = require("@firebase/util");

exports.getUserById = async (req, res) => {
  const user = await UserModel.findById(req.params.id);
  if (!user) return ApiError.notFound("user does not exist");
  res.status(200).json();
};

exports.getPublicConversations = async (req, res, next) => {
  const publicConversations = await ConversationModel.find({
    identifier: "public",
  });
  return res.status(200).json(publicConversations);
};

exports.getContacts = async (req, res, next) => {
  console.log(xeeee.lol);
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

exports.addContact = async (req, res, next) => {
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
  res.status(200).json({ ...newConvo._doc, user: requester });
};

exports.deleteContact = async (req, res, next) => {
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

exports.blacklistUser = async (req, res, next) => {
  const blackListedUserId = req.params.id;
  const userId = req.userInfo._id;

  const user = await UserModel.findById(userId);
  const convo_indentifier = createConversationId(userId, blackListedUserId);
  const conversation = await ConversationModel.exists({
    identifier: convo_indentifier,
  });

  if (conversation) {
    await ConversationModel.deleteOne({ _id: conversation._id });
    MessageModel.deleteMany({ conversation: conversation._id });
  }
  user.black_listed_users.push(new mongoose.Types.ObjectId(blackListedUserId));
  await user.save();
  return res.sendStatus(200);
};

exports.blockContact = async (req, res, next) => {
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

exports.unblockContact = async (req, res, next) => {
  const blockedUserId = req.params.id;
  const userId = req.userInfo._id;
  const convo_indentifier = createConversationId(userId, blockedUserId);

  const conversation = await ConversationModel.findOne({
    identifier: convo_indentifier,
  });

  if (!conversation) return next(ApiError.notFound("conversation not found"));
  if (!conversation.admins.find((user) => user.toString() === userId))
    return next(ApiError.forbidden());
  if (!conversation.blocked.find((user) => user.toString() === blockedUserId))
    return next(ApiError.forbidden("user not blocked"));
  conversation.blocked = conversation.blocked.filter(
    (user) => user._id.toString() !== blockedUserId
  );
  await conversation.save();
  return res.sendStatus(200);
};

exports.getContactRequests = async (req, res, next) => {
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
exports.addContactRequest = async (req, res, next) => {
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
exports.deleteContactRequest = async (req, res, next) => {
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
exports.getContactCandidates = async (req, res, next) => {
  const searchtext = req.query.search;

  const user = await UserModel.findById(req.userInfo._id);
  const objectUserId = new mongoose.Types.ObjectId(req.userInfo._id);

  const requests = await RequestModel.find({
    $or: [{ requester: req.userInfo._id }, { destinator: req.userInfo._id }],
  });

  // get all users that have a request with current user
  const requested = requests.map((request) => {
    return request.requester.toString() === req.userInfo._id
      ? request.destinator
      : request.requester;
  });

  const conversations = await ConversationModel.find({
    identifier: { $regex: new RegExp(req.userInfo._id) },
  });

  // get all users in contact with current user
  const contacts = conversations.map((convo) => {
    let user = convo.users.find((user) => user.toString() !== req.userInfo._id);
    return user;
  });

  filterList = contacts.concat(requested);
  filterList.push(mongoose.Types.ObjectId(req.userInfo._id));
  filterList.concat(user.black_listed_users);

  const matchQuery = {
    _id: { $not: { $in: filterList } },
    black_listed_users: { $ne: objectUserId },
  };
  if (searchtext) {
    matchQuery["$or"] = [
      { username: { $regex: new RegExp(searchtext) } },
      { personal_name: { $regex: new RegExp(searchtext) } },
    ];
  }

  let candidates = await UserModel.aggregate([
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
exports.getSelfProfile = async (req, res, next) => {
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
exports.getUserProfile = async (req, res, next) => {
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
exports.getContactProfileByConversationId = async (req, res, next) => {
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

exports.updateProfile = async (req, res, next) => {
  const { username, personal_name, email } = req.body;
  if (!(username && personal_name && email))
    return next(ApiError.badRequest("value not provided"));
  const user = await UserModel.findById(req.userInfo._id);
  user.username = username;
  user.personal_name = personal_name;
  user.email = email;
  const savedUser = await user.save();
  res.status(200).json(savedUser);
};
exports.updateProfilePicture = async (req, res, next) => {
  const image = req.files.profile_pic;
  if (!image) return next(ApiError.badRequest("no image"));
  imageRef = ref(storage, "profile/" + req.userInfo._id);
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
exports.profilePictureFileCatch = fileUpload({
  limits: 1024 * 1024 * 3,
  limitHandler: (req, res, next) => {
    return next(ApiError.badRequest("image surpass the size limit of 3mb"));
  },
});

function createConversationId(id1, id2) {
  if (id1 > id2) {
    return id1 + id2;
  }
  return id2 + id1;
}
