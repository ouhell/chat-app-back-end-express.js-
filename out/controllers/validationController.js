"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ApiError_1 = __importDefault(require("../error/ApiError"));
const validateId = (req, res, next, value) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
        return next(ApiError_1.default.badRequest("invalid id"));
    }
    return next();
};
exports.validateId = validateId;
