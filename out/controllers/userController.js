"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.profilePictureFileCatch = exports.updateProfilePicture = exports.updateProfile = exports.getContactProfileByConversationId = exports.getUserProfile = exports.getSelfProfile = exports.getContactCandidates = exports.deleteContactRequest = exports.addContactRequest = exports.getContactRequests = exports.unblockContact = exports.blockContact = exports.blacklistUser = exports.deleteContact = exports.addContact = exports.getContacts = exports.getPublicConversations = exports.getUserById = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MessageModel_1 = __importDefault(require("../schema/message/MessageModel"));
const ConversationModel_1 = __importDefault(require("../schema/message/ConversationModel"));
const UserModel_1 = __importDefault(require("../schema/user/UserModel"));
const ApiError_1 = __importDefault(require("../error/ApiError"));
//const ErrorCatcher = require("../error/ErrorCatcher");
const RequestModel_1 = __importDefault(require("../schema/request/RequestModel"));
const config_1 = require("../firebase/config");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const { deleteObject, ref, uploadBytes, getDownloadURL, } = require("firebase/storage");
const getUserById = async (req, res, next) => {
    const user = await UserModel_1.default.findById(req.params.id);
    if (!user)
        return ApiError_1.default.notFound("user does not exist");
    res.status(200).json();
};
exports.getUserById = getUserById;
const getPublicConversations = async (req, res, next) => {
    const publicConversations = await ConversationModel_1.default.find({
        identifier: "public",
    });
    return res.status(200).json(publicConversations);
};
exports.getPublicConversations = getPublicConversations;
const getContacts = async (req, res, next) => {
    const conversations = await ConversationModel_1.default.aggregate([
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
                    $not: { $eq: new mongoose_1.default.Types.ObjectId(req.userInfo._id) },
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
exports.getContacts = getContacts;
const addContact = async (req, res, next) => {
    const postedId = req.params.id;
    const userId = req.userInfo._id;
    //fetch the request
    const request = await RequestModel_1.default.findById(postedId);
    // check if request exists
    if (!request) {
        return next(ApiError_1.default.forbidden(`request  does not exists`));
    }
    // cant accept request sent to others
    if (userId !== request.destinator.toString())
        return next(ApiError_1.default.forbidden("request not destined to user"));
    const requester = await UserModel_1.default.findById(request.requester, {
        username: 1,
        personal_name: 1,
        email: 1,
        profile_picture: 1,
        _id: 1,
    });
    if (!requester) {
        RequestModel_1.default.deleteOne({
            _id: postedId,
        });
        return next(ApiError_1.default.forbidden("USER DOES NOT EXIST"));
    }
    //check if convo already exists
    const convo_indentifier = createConversationId(userId, request.requester.toString());
    const conversation = await ConversationModel_1.default.exists({
        identifier: convo_indentifier,
    });
    if (conversation) {
        RequestModel_1.default.deleteOne({
            _id: postedId,
        });
        return next(ApiError_1.default.badRequest("contact already in contact list"));
    }
    await RequestModel_1.default.deleteOne({
        _id: postedId,
    });
    const newConvo = await ConversationModel_1.default.create({
        identifier: convo_indentifier,
        users: [userId, requester._id],
        admins: [userId, requester._id],
    });
    res.status(200).json({ ...newConvo, user: requester });
};
exports.addContact = addContact;
const deleteContact = async (req, res, next) => {
    const contactId = req.params.id;
    const userId = req.userInfo._id;
    //check if convo already exists
    const convo_indentifier = createConversationId(userId, contactId);
    const conversation = await ConversationModel_1.default.exists({
        identifier: convo_indentifier,
    });
    if (!conversation) {
        return next(ApiError_1.default.badRequest("contact doesn't exist"));
    }
    await ConversationModel_1.default.deleteOne({ _id: conversation._id });
    MessageModel_1.default.deleteMany({ conversation: conversation._id });
    return res.sendStatus(204);
};
exports.deleteContact = deleteContact;
const blacklistUser = async (req, res, next) => {
    const blackListedUserId = req.params.id;
    const userId = req.userInfo._id;
    const user = await UserModel_1.default.findById(userId);
    const convo_indentifier = createConversationId(userId, blackListedUserId);
    const conversation = await ConversationModel_1.default.exists({
        identifier: convo_indentifier,
    });
    if (!user) {
        return next(new ApiError_1.default(404, "user not found"));
    }
    if (conversation) {
        await ConversationModel_1.default.deleteOne({ _id: conversation._id });
        MessageModel_1.default.deleteMany({ conversation: conversation._id });
    }
    const blockedObjectId = new mongoose_1.default.Types.ObjectId(blackListedUserId);
    user.black_listed_users.push(blockedObjectId);
    await user.save();
    return res.sendStatus(200);
};
exports.blacklistUser = blacklistUser;
const blockContact = async (req, res, next) => {
    console.log("blocking");
    const blockedUserId = req.params.id;
    const userId = req.userInfo._id;
    const convo_indentifier = createConversationId(userId, blockedUserId);
    const conversation = await ConversationModel_1.default.findOne({
        identifier: convo_indentifier,
    });
    if (!conversation)
        return next(ApiError_1.default.notFound("conversation not found"));
    if (!conversation.admins.find((user) => user._id.toString() === userId))
        return next(ApiError_1.default.forbidden("not an admin"));
    if (conversation.blocked.find((user) => user._id.toString() === blockedUserId))
        return next(ApiError_1.default.forbidden("user already blocked"));
    conversation.blocked.push(new mongoose_1.default.Types.ObjectId(blockedUserId));
    await conversation.save();
    return res.sendStatus(200);
};
exports.blockContact = blockContact;
const unblockContact = async (req, res, next) => {
    const blockedUserId = req.params.id;
    const userId = req.userInfo._id;
    const convo_indentifier = createConversationId(userId, blockedUserId);
    const conversation = await ConversationModel_1.default.findOne({
        identifier: convo_indentifier,
    });
    if (!conversation)
        return next(ApiError_1.default.notFound("conversation not found"));
    if (!conversation.admins.find((user) => user.toString() === userId))
        return next(ApiError_1.default.forbidden("user is not admin"));
    if (!conversation.blocked.find((user) => user.toString() === blockedUserId))
        return next(ApiError_1.default.forbidden("user not blocked"));
    conversation.blocked = conversation.blocked.filter((user) => user._id.toString() !== blockedUserId);
    await conversation.save();
    return res.sendStatus(200);
};
exports.unblockContact = unblockContact;
const getContactRequests = async (req, res, next) => {
    /* const requests = await RequestModel.find({
      $or: [{ requester: req.userInfo._id }, { destinator: req.userInfo._id }],
    }); */
    const ObjectUserId = new mongoose_1.default.Types.ObjectId(req.userInfo._id);
    const requests = await RequestModel_1.default.aggregate([
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
exports.getContactRequests = getContactRequests;
const addContactRequest = async (req, res, next) => {
    const destinator = req.params.id;
    if (req.userInfo._id === destinator)
        return next(ApiError_1.default.badRequest("cant request from self"));
    const destinatorExists = await UserModel_1.default.exists({ _id: destinator });
    if (!destinatorExists)
        return next(ApiError_1.default.forbidden("destinator does not exists"));
    const contactAlreadyExists = await ConversationModel_1.default.exists({
        identifier: createConversationId(req.userInfo._id, destinator),
    });
    if (contactAlreadyExists)
        return next(ApiError_1.default.forbidden("contact already exists"));
    const requestAlreadyExists = await RequestModel_1.default.exists({
        $or: [
            { requester: req.userInfo._id, destinator: destinator },
            { requester: destinator, destinator: req.userInfo._id },
        ],
    });
    if (requestAlreadyExists)
        return next(ApiError_1.default.forbidden("request already exists"));
    const request = await RequestModel_1.default.create({
        requester: req.userInfo._id,
        destinator,
    });
    const appendedRequest = await RequestModel_1.default.aggregate([
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
exports.addContactRequest = addContactRequest;
const deleteContactRequest = async (req, res, next) => {
    const postedId = req.params.id;
    const request = await RequestModel_1.default.findById(postedId);
    if (!request)
        return next(ApiError_1.default.notFound("request does not exists"));
    if (request.requester.toString() !== req.userInfo._id &&
        request.destinator.toString() !== req.userInfo._id)
        return next(ApiError_1.default.forbidden("cant cancel unaffliated request"));
    await RequestModel_1.default.deleteOne({
        _id: postedId,
    });
    return res.status(200).json(request);
};
exports.deleteContactRequest = deleteContactRequest;
const getContactCandidates = async (req, res, next) => {
    const searchtext = req.query.search;
    const user = await UserModel_1.default.findById(req.userInfo._id);
    if (!user) {
        return next(ApiError_1.default.notFound("user not found"));
    }
    const objectUserId = new mongoose_1.default.Types.ObjectId(req.userInfo._id);
    const requests = await RequestModel_1.default.find({
        $or: [{ requester: req.userInfo._id }, { destinator: req.userInfo._id }],
    });
    // get all users that have a request with current user
    const requested = requests.map((request) => {
        return request.requester.toString() === req.userInfo._id
            ? new mongoose_1.default.Types.ObjectId(request.destinator.toString())
            : new mongoose_1.default.Types.ObjectId(request.requester.toString());
    });
    const conversations = await ConversationModel_1.default.find({
        identifier: { $regex: new RegExp(req.userInfo._id) },
    });
    // get all users in contact with current user
    const contacts = conversations.reduce((contacts, convo) => {
        return contacts.concat(convo.users.filter((user) => user._id.toString() !== user._id.toString()));
    }, []);
    //   .map((convo) => {
    //     let user = convo.users.find((user) => user.toString() !== req.userInfo._id);
    //     return user;
    //   });
    const filterList = contacts.concat(requested);
    filterList.push(new mongoose_1.default.Types.ObjectId(req.userInfo._id));
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
    let candidates = await UserModel_1.default.aggregate([
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
exports.getContactCandidates = getContactCandidates;
const getSelfProfile = async (req, res, next) => {
    const objectUserId = new mongoose_1.default.Types.ObjectId(req.userInfo._id);
    const profile = await UserModel_1.default.aggregate([
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
exports.getSelfProfile = getSelfProfile;
const getUserProfile = async (req, res, next) => {
    const id = req.params.id;
    const objectId = new mongoose_1.default.Types.ObjectId(id);
    const profile = await UserModel_1.default.aggregate([
        { $match: { _id: objectId } },
        {
            $project: {
                username: 1,
                personal_name: 1,
                profile_picture: 1,
            },
        },
    ]);
    if (profile.length === 0)
        return next(ApiError_1.default.notFound("user not found"));
    res.status(200).json(profile[0]);
};
exports.getUserProfile = getUserProfile;
const getContactProfileByConversationId = async (req, res, next) => {
    const conversationId = req.params.id;
    const objectId = new mongoose_1.default.Types.ObjectId(conversationId);
    const profile = await ConversationModel_1.default.aggregate([
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
                    $not: { $eq: new mongoose_1.default.Types.ObjectId(req.userInfo._id) },
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
    if (profile.length === 0)
        return next(ApiError_1.default.notFound("user not found"));
    res.status(200).json(profile[0]);
};
exports.getContactProfileByConversationId = getContactProfileByConversationId;
const updateProfile = async (req, res, next) => {
    const { username, personal_name, email } = req.body;
    if (!(username && personal_name && email))
        return next(ApiError_1.default.badRequest("value not provided"));
    const user = await UserModel_1.default.findById(req.userInfo._id);
    if (!user) {
        return next(ApiError_1.default.notFound("user not found"));
    }
    user.username = username;
    user.personal_name = personal_name;
    user.email = email;
    const savedUser = await user.save();
    res.status(200).json(savedUser);
};
exports.updateProfile = updateProfile;
const updateProfilePicture = async (req, res, next) => {
    if (!req.files)
        return next(ApiError_1.default.badRequest("no file"));
    const image = req.files.profile_pic;
    if (!image)
        return next(ApiError_1.default.badRequest("no image"));
    const imageRef = ref(config_1.storage, "profile/" + req.userInfo._id);
    const metadata = {
        contentType: image.mimetype,
    };
    await uploadBytes(imageRef, image.data, metadata);
    const url = await getDownloadURL(imageRef);
    await UserModel_1.default.findByIdAndUpdate(req.userInfo._id, {
        profile_picture: url,
    });
    return res.status(203).json({
        newUrl: url,
    });
};
exports.updateProfilePicture = updateProfilePicture;
exports.profilePictureFileCatch = (0, express_fileupload_1.default)({
    limits: { fileSize: 1024 * 1024 * 3 },
    limitHandler: (req, res, next) => {
        return next(ApiError_1.default.badRequest("image surpass the size limit of 3mb"));
    },
});
function createConversationId(id1, id2) {
    if (id1 > id2) {
        return id1 + id2;
    }
    return id2 + id1;
}
