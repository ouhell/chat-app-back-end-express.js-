const express = require("express");
const mongoose = require("mongoose");
const UserModel = require("../../schema/user/UserModel");
const ConversationModel = require("../../schema/message/ConversationModel");
const RequestModel = require("../../schema/request/RequestModel");
const UserController = express.Router();
const ErrorCatcher = require("../../error/ErrorCatcher");
const ApiError = require("../../error/ApiError");
const UserResponseData = require("../../data/user/UserResponseData");
const fileUpload = require("express-fileupload");
const { storage } = require("../../firebase/config");
const {
  deleteObject,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");

//get user by id
UserController.get(
  "/users/:id",
  ErrorCatcher(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return next(ApiError.forbidden("invalid id"));

    const user = await UserModel.findById(req.params.id);
    if (!user) return ApiError.notFound("user does not exist");
    res.status(200).json();
  })
);

//get user contact list
UserController.get(
  "/user-contact",
  ErrorCatcher(async (req, res, next) => {
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
  })
);

// add a new contact to the user
UserController.post(
  "/user-contact/:id",
  ErrorCatcher(async (req, res, next) => {
    const postedId = req.params.id;
    // check if id is valid mongo ObjectId
    if (!mongoose.Types.ObjectId.isValid(postedId)) {
      return next(ApiError.badRequest("invalid request id"));
    }

    const user = await UserModel.findById(req.userInfo._id);

    //fetch the request
    const request = await RequestModel.findById(postedId);

    // check if request exists
    if (!request) {
      return next(ApiError.forbidden(`request  does not exists`));
    }

    if (!user) {
      RequestModel.deleteOne({
        _id: postedId,
      });
      return next(ApiError.forbidden("USER DOES NOT EXIST"));
    }

    // cant accept request sent by self
    if (user._id.toString() !== request.destinator.toString())
      return next(ApiError.forbidden("cant accept own request"));

    //check if convo already exists
    const convo_indentifier = createConversationId(
      user._id.toString(),
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
    const contact = await UserModel.findById(request.requester.toString());

    if (!contact) {
      RequestModel.deleteOne({
        _id: postedId,
      });
      return next(ApiError.forbidden("requester does not exist"));
    }

    await RequestModel.deleteOne({
      _id: postedId,
    });

    const newConvo = await ConversationModel.create({
      identifier: convo_indentifier,
      users: [user._id, contact._id],
    });
    res.status(200).json(newConvo);
  })
);

UserController.get(
  "/request",
  ErrorCatcher(async (req, res, next) => {
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
  })
);

UserController.post(
  "/request",
  ErrorCatcher(async (req, res, next) => {
    const { destinator } = req.body;
    if (req.userInfo._id === destinator)
      return next(ApiError.badRequest("cant request from self"));

    if (!mongoose.Types.ObjectId.isValid(destinator))
      return next(ApiError.badRequest("invalid destinator id"));
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
    return res.status(201).json(request);
  })
);

UserController.delete(
  "/request/:requestId",
  ErrorCatcher(async (req, res, next) => {
    const postedId = req.params.requestId;
    if (!mongoose.Types.ObjectId.isValid(postedId))
      return next(ApiError.badRequest("invalid request id"));

    const request = await RequestModel.findById(postedId);

    if (!request) return next(ApiError.notFound("request does not exists"));

    if (
      request.requester.toString() !== req.userInfo._id &&
      request.destinator.toString() !== req.userInfo._id
    )
      return next(ApiError.forbidden("cant cancel unaffliated request"));

    const deletedRequest = await RequestModel.deleteOne({
      _id: postedId,
    });

    return res.status(204).json(deletedRequest);
  })
);

//get user that can be sent a request
UserController.get(
  "/request/candidates",
  ErrorCatcher(async (req, res, next) => {
    const searchtext = req.query.search;

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
      let user = convo.users.find(
        (user) => user.toString() !== req.userInfo._id
      );
      return user;
    });

    filterList = contacts.concat(requested);
    filterList.push(mongoose.Types.ObjectId(req.userInfo._id));

    const matchQuery = {
      _id: { $not: { $in: filterList } },
    };
    if (searchtext) {
      matchQuery["$or"] = [
        { username: { $regex: new RegExp(searchtext) } },
        { personal_name: { $regex: new RegExp(searchtext) } },
      ];
    }

    let candidates = await UserModel.aggregate([
      { $match: matchQuery },
      { $limit: 20 },
      {
        $project: {
          _id: 1,
          username: 1,
          personal_name: 1,
          email: 1,
          profile_picture: 1,
        },
      },
    ]);

    /* candidates = candidates.map((candidate) => {
    return new UserResponseData(candidate);
  }); */

    return res.status(200).json(candidates);
  })
);

UserController.get(
  "/profile",
  ErrorCatcher(async (req, res, next) => {
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
  })
);
UserController.get(
  "/profile/:id",
  ErrorCatcher(async (req, res, next) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(ApiError.badRequest("invalid id"));
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
  })
);
UserController.get(
  "/contact_profile/:id",
  ErrorCatcher(async (req, res, next) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return next(ApiError.badRequest("invalid convo id"));
    const objectId = new mongoose.Types.ObjectId(id);
    const profile = await ConversationModel.aggregate([
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "users",
        },
      },
      { $unwind: "$users" },
      {
        $match: {
          "users._id": {
            $not: { $eq: new mongoose.Types.ObjectId(req.userInfo._id) },
          },
        },
      },
      {
        $project: {
          _id: 0,
          username: "$users.username",
          personal_name: "$users.personal_name",
          profile_picture: "$users.profile_picture",
        },
      },
    ]);

    if (profile.length === 0) return next(ApiError.notFound("user not found"));

    res.status(200).json(profile[0]);
  })
);

UserController.put(
  "/profile",
  ErrorCatcher(async (req, res, next) => {
    const { username, personal_name, email } = req.body;
    if (!(username && personal_name && email))
      return next(ApiError.badRequest("value not provided"));
    const user = await UserModel.findById(req.userInfo._id);
    user.username = username;
    user.personal_name = personal_name;
    user.email = email;
    const savedUser = await user.save();
    res.status(200).json(savedUser);
  })
);

UserController.put(
  "/profile/picture",
  fileUpload({
    limits: 1024 * 1024 * 3,
    limitHandler: (req, res, next) => {
      return next(ApiError.badRequest("image surpass the size limit of 3mb"));
    },
  }),
  ErrorCatcher(async (req, res, next) => {
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
  })
);

// utility functions

function createConversationId(id1, id2) {
  if (id1 > id2) {
    return id1 + id2;
  }
  return id2 + id1;
}

function validatePassword(password) {
  if (!password || !password instanceof String || password.length < 8)
    return false;
  return true;
}

module.exports = UserController;
