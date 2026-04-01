import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import MessageModel from "../schema/message/MessageModel";
import ConversationModel from "../schema/message/ConversationModel";
import UserModel from "../schema/user/UserModel";
import ApiError from "../error/ApiError";
//const ErrorCatcher = require("../error/ErrorCatcher");
import fileupload from "express-fileupload";

import fileUpload from "express-fileupload";
import { MessagesPayload } from "./responseTypes/messageResponses";
import { Paginated } from "./responseTypes/pagination";
import { Message } from "../@types/schemas";
import { deleteFromS3, uploadToS3 } from "../storage/s3Storage";
import { BaseController } from "./base.controller";
const { v4 } = require("uuid");

export class MessageController extends BaseController {
  getConversationMessages = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    this.handleRequest(req, res, next, async () => {
      const page_size = 30;
      const conversation_id = req.params.id;
      const { skip } = req.query;
      let offset: number = parseInt(skip as string) || 0;

      const userId = req.userInfo._id;
      const conversation = await ConversationModel.findById(conversation_id);

      if (!conversation)
        return next(ApiError.notFound("can't find coversation"));
      if (conversation.identifier !== "public") {
        if (!conversation.users.find((user) => user.toString() === userId))
          return next(ApiError.forbidden("not a part of the conversation"));
      }

      const messages = await MessageModel.aggregate([
        {
          $match: {
            conversation: new mongoose.Types.ObjectId(conversation_id),
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

      const count = await MessageModel.count({
        conversation: new mongoose.Types.ObjectId(conversation_id),
        hidden: false,
      });
      messages.reverse();

      const currentPage = Math.floor(offset / page_size) + 1;
      const totalPages = Math.ceil(count / page_size);

      const paginatedMessages: Paginated<Message> = {
        data: messages,
        size: messages.length,
        total_size: 0,
        current_page: Math.floor(offset / page_size) + 1,
        total_pages: Math.ceil(count / page_size),
        isFirstPage: currentPage === 1,
        isLastPage: currentPage === totalPages,
      };

      return { conversation, messages: paginatedMessages };
    });
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
    this.handleRequest(
      req,
      res,
      next,
      async () => {
        let message_id = req.params.id;
        const userId = req.userInfo._id;

        message_id = new mongoose.Types.ObjectId(
          message_id.toString(),
        ).toString();
        const message = await MessageModel.findById(message_id);
        if (!message) return next(ApiError.notFound("message does not exist"));
        if (message.sender.toString() !== userId)
          return next(ApiError.forbidden("cant delete other users message"));

        message.hidden = true;
        await message.save();
        return { success: true };
      },
      202,
    );
  };

  addTextMessage = async (req: Request, res: Response, next: NextFunction) => {
    this.handleRequest(
      req,
      res,
      next,
      async () => {
        const conversation_id = req.params.id;
        const user_id = req.userInfo._id;
        const message = req.body.message;

        if (
          !(typeof message === "string" || message instanceof String) ||
          !message.trim()
        )
          return next(ApiError.badRequest("invalid message"));
        // find if conversation exists and not blocked
        const conversation = await ConversationModel.findById(conversation_id);

        if (!conversation)
          return next(ApiError.notFound("can't find coversation"));

        if (conversation.identifier !== "public") {
          if (conversation.blocked.find((user) => user.toString() === user_id))
            return next(ApiError.forbidden("blocked"));

          if (!conversation.users.find((user) => user.toString() === user_id))
            return next(ApiError.forbidden("not a part of the conversation"));
        }

        const createdMessage = await MessageModel.create({
          sender: user_id,
          conversation: conversation_id,
          message: message,
          content_type: "text",
        });

        return createdMessage;
      },
      201,
    );
  };

  addImageMessage = async (req: Request, res: Response, next: NextFunction) => {
    this.handleRequest(
      req,
      res,
      next,
      async () => {
        const conversation_id = req.params.id;

        const user_id = req.userInfo._id;
        const acceptedImageTypes = ["image/gif", "image/jpeg", "image/png"];

        if (!req.files) return next(ApiError.badRequest("no file"));
        const file = req.files.file as fileUpload.UploadedFile;
        if (!file) return next(ApiError.badRequest("no file"));

        if (!acceptedImageTypes.includes(file.mimetype))
          return next(ApiError.badRequest("only accept .png .jpg .gif"));

        // find if conversation exists and not blocked
        const conversation = await ConversationModel.findById(conversation_id);

        if (!conversation)
          return next(ApiError.notFound("can't find coversation"));
        conversation._id;
        if (conversation.identifier !== "public") {
          if (conversation.blocked.find((user) => user.toString() === user_id))
            return next(ApiError.forbidden("blocked"));

          if (!conversation.users.find((user) => user.toString() === user_id))
            return next(ApiError.forbidden("not a part of the conversation"));
        }

        const { key, url } = await uploadToS3({
          key: `images/${v4()}`,
          body: file.data,
          contentType: file.mimetype,
        });

        try {
          const createdMessage = await MessageModel.create({
            sender: user_id,
            conversation: new mongoose.Types.ObjectId(conversation_id),
            content: url,
            content_type: "image",
          });

          return createdMessage;
        } catch (err) {
          await deleteFromS3(key);
          throw ApiError.internal("couldnt send message");
        }
      },
      201,
    );
  };

  imageMessageFileCatch = fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 1 megabytes"),
      );
    },
  });

  addVoiceMessage = async (req: Request, res: Response, next: NextFunction) => {
    this.handleRequest(req, res, next, async () => {
      const conversation_id = req.params.id;
      const user_id = req.userInfo._id;
      const { duration } = req.body;
      const acceptedAudioTypes = ["audio/mp3", "audio/webm"];

      if (!req.files) return next(ApiError.badRequest("no file"));
      const file = req.files.voice as fileUpload.UploadedFile;
      if (!file) return next(ApiError.badRequest("no file"));

      if (!acceptedAudioTypes.includes(file.mimetype))
        return next(ApiError.badRequest("only accept mp3"));

      const conversation = await ConversationModel.findById(conversation_id);

      if (!conversation)
        return next(ApiError.notFound("can't find coversation"));

      if (conversation.identifier !== "public") {
        if (conversation.blocked.find((user) => user.toString() === user_id))
          return next(ApiError.forbidden("blocked"));

        if (!conversation.users.find((user) => user.toString() === user_id))
          return next(ApiError.forbidden("not a part of the conversation"));
      }

      const extension = file.mimetype.includes("/")
        ? file.mimetype.split("/")[1]
        : "bin";

      const { key, url } = await uploadToS3({
        key: `audio/${v4()}.${extension}`,
        body: file.data,
        contentType: file.mimetype,
        metadata: {
          duration: Math.floor(duration) + "",
        },
      });

      try {
        const createdMessage = await MessageModel.create({
          sender: user_id,
          conversation: new mongoose.Types.ObjectId(conversation_id),
          content: url,
          content_type: "voice",
        });

        return createdMessage;
      } catch (err) {
        await deleteFromS3(key);
        throw ApiError.internal("couldnt send message");
      }
    });
  };
  voiceMessageFileCatch = fileupload({
    createParentPath: true,
    limits: { fileSize: 1024 * 1024 * 5 },
    limitHandler: async (req, res, next) => {
      return next(
        ApiError.badRequest("file size surpass allowed limits of 5 megabytes"),
      );
    },
  });
}
