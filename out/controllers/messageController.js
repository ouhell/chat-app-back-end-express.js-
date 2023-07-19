"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceMessageFileCatch = exports.addVoiceMessage = exports.imageMessageFileCatch = exports.addImageMessage = exports.addTextMessage = exports.deleteMessage = exports.getConversationMessages = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const MessageModel_1 = __importDefault(require("../schema/message/MessageModel"));
const ConversationModel_1 = __importDefault(require("../schema/message/ConversationModel"));
const ApiError_1 = __importDefault(require("../error/ApiError"));
//const ErrorCatcher = require("../error/ErrorCatcher");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const config_1 = require("../firebase/config");
const { ref, uploadBytes, getDownloadURL, deleteObject, } = require("firebase/storage");
const { v4 } = require("uuid");
const getConversationMessages = async (req, res, next) => {
    const page_size = 30;
    const conversation_id = req.params.id;
    const { skip } = req.query;
    let offset = parseInt(skip) || 0;
    const userId = req.userInfo._id;
    const conversation = await ConversationModel_1.default.findById(conversation_id);
    if (!conversation)
        return next(ApiError_1.default.notFound("can't find coversation"));
    if (conversation.identifier !== "public") {
        if (!conversation.users.find((user) => user.toString() === userId))
            return next(ApiError_1.default.forbidden("not a part of the conversation"));
    }
    const messages = await MessageModel_1.default.aggregate([
        {
            $match: {
                conversation: new mongoose_1.default.Types.ObjectId(conversation_id),
                hidden: false,
            },
        },
        { $sort: { sent_date: -1 } },
        { $skip: offset },
        { $limit: page_size },
        {
            $lookup: {
                localField: "sender",
                foreignField: "_id",
                from: "users",
                as: "sender",
            },
        },
        { $unwind: "$sender" },
        {
            $project: {
                _id: 1,
                conversation: 1,
                message: 1,
                content_type: 1,
                content: 1,
                sent_date: 1,
                "sender._id": 1,
                "sender.username": 1,
                "sender.personal_name": 1,
                "sender.profile_picture": 1,
            },
        },
    ]);
    const count = await MessageModel_1.default.count({
        conversation: new mongoose_1.default.Types.ObjectId(conversation_id),
        hidden: false,
    });
    messages.reverse();
    const currentPage = Math.floor(offset / page_size) + 1;
    const totalPages = Math.ceil(count / page_size);
    const paginatedMessages = {
        data: messages,
        size: messages.length,
        total_size: 0,
        current_page: Math.floor(offset / page_size) + 1,
        total_pages: Math.ceil(count / page_size),
        isFirstPage: currentPage === 1,
        isLastPage: currentPage === totalPages,
    };
    res.status(200).json({ conversation, messages: paginatedMessages });
};
exports.getConversationMessages = getConversationMessages;
const deleteMessage = async (req, res, next) => {
    let message_id = req.params.id;
    const userId = req.userInfo._id;
    message_id = new mongoose_1.default.Types.ObjectId(message_id.toString()).toString();
    const message = await MessageModel_1.default.findById(message_id);
    if (!message)
        return next(ApiError_1.default.notFound("message does not exist"));
    if (message.sender.toString() !== userId)
        return next(ApiError_1.default.forbidden("cant delete other users message"));
    message.hidden = true;
    await message.save();
    return res.sendStatus(202);
};
exports.deleteMessage = deleteMessage;
const addTextMessage = async (req, res, next) => {
    const conversation_id = req.params.id;
    const user_id = req.userInfo._id;
    const message = req.body.message;
    if (!(typeof message === "string" || message instanceof String) ||
        !message.trim())
        return next(ApiError_1.default.badRequest("invalid message"));
    // find if conversation exists and not blocked
    const conversation = await ConversationModel_1.default.findById(conversation_id);
    if (!conversation)
        return next(ApiError_1.default.notFound("can't find coversation"));
    if (conversation.identifier !== "public") {
        if (conversation.blocked.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("blocked"));
        if (!conversation.users.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("not a part of the conversation"));
    }
    const createdMessage = await MessageModel_1.default.create({
        sender: user_id,
        conversation: conversation_id,
        message: message,
        content_type: "text",
    });
    return res.status(201).json(createdMessage);
};
exports.addTextMessage = addTextMessage;
const addImageMessage = async (req, res, next) => {
    const conversation_id = req.params.id;
    const user_id = req.userInfo._id;
    const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];
    if (!req.files)
        return next(ApiError_1.default.badRequest("no file"));
    const file = req.files.file;
    if (!file)
        return next(ApiError_1.default.badRequest("no file"));
    if (!acceptedImageTypes.includes(file.mimetype))
        return next(ApiError_1.default.badRequest("only accept .png .jpg .gif"));
    const metadata = {
        contentType: file.mimetype,
    };
    // find if conversation exists and not blocked
    const conversation = await ConversationModel_1.default.findById(conversation_id);
    if (!conversation)
        return next(ApiError_1.default.notFound("can't find coversation"));
    if (conversation.identifier !== "public") {
        if (conversation.blocked.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("blocked"));
        if (!conversation.users.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("not a part of the conversation"));
    }
    const fileRef = ref(config_1.storage, "images/" + v4());
    let url = null;
    await uploadBytes(fileRef, file.data, metadata);
    url = await getDownloadURL(fileRef);
    try {
        const createdMessage = await MessageModel_1.default.create({
            sender: user_id,
            conversation: new mongoose_1.default.Types.ObjectId(conversation_id),
            content: url,
            content_type: "image",
        });
        return res.status(201).json(createdMessage);
    }
    catch (err) {
        deleteObject(fileRef);
        next(ApiError_1.default.internal("couldnt send message"));
    }
};
exports.addImageMessage = addImageMessage;
exports.imageMessageFileCatch = (0, express_fileupload_1.default)({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 },
    limitHandler: async (req, res, next) => {
        return next(ApiError_1.default.badRequest("file size surpass allowed limits of 1 megabytes"));
    },
});
const addVoiceMessage = async (req, res, next) => {
    const conversation_id = req.params.id;
    const user_id = req.userInfo._id;
    const { duration } = req.body;
    const acceptedAudioTypes = ["audio/mp3", "audio/webm"];
    if (!req.files)
        return next(ApiError_1.default.badRequest("no file"));
    const file = req.files.voice;
    if (!file)
        return next(ApiError_1.default.badRequest("no file"));
    if (!acceptedAudioTypes.includes(file.mimetype))
        return next(ApiError_1.default.badRequest("only accept mp3"));
    const metadata = {
        contentType: file.mimetype,
        customMetadata: {
            duration: Math.floor(duration) + "",
        },
    };
    const conversation = await ConversationModel_1.default.findById(conversation_id);
    if (!conversation)
        return next(ApiError_1.default.notFound("can't find coversation"));
    if (conversation.identifier !== "public") {
        if (conversation.blocked.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("blocked"));
        if (!conversation.users.find((user) => user.toString() === user_id))
            return next(ApiError_1.default.forbidden("not a part of the conversation"));
    }
    const fileRef = ref(config_1.storage, "audio/" + v4() + "." + file.mimetype.substr(6));
    // let url = null;
    await uploadBytes(fileRef, file.data, metadata);
    const url = await getDownloadURL(fileRef);
    try {
        const createdMessage = await MessageModel_1.default.create({
            sender: user_id,
            conversation: new mongoose_1.default.Types.ObjectId(conversation_id),
            content: url,
            content_type: "voice",
        });
        return res.status(201).json(createdMessage);
    }
    catch (err) {
        deleteObject(fileRef);
        next(ApiError_1.default.internal("couldnt send message"));
    }
};
exports.addVoiceMessage = addVoiceMessage;
exports.voiceMessageFileCatch = (0, express_fileupload_1.default)({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 * 5 },
    limitHandler: async (req, res, next) => {
        return next(ApiError_1.default.badRequest("file size surpass allowed limits of 5 megabytes"));
    },
});
