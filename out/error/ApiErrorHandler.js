"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("./ApiError"));
const ApiErrorHandler = (err, req, res, next) => {
    if (err instanceof ApiError_1.default) {
        res.status(err.code).json(err);
        return;
    }
    console.log("ApiErrorHandler passed error : ", err);
    res.status(500).json(new ApiError_1.default(500, "internal server error"));
};
exports.default = ApiErrorHandler;
