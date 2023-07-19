"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("./ApiError"));
const ErrorCatcher = (handlerFunction) => {
    return async (req, res, next) => {
        try {
            await handlerFunction(req, res, next);
        }
        catch (err) {
            if (err instanceof Error) {
                console.error("catched unexpected error : ", "named : ", err.name, "\n", err, "\n");
            }
            let content = "internal server error";
            next(new ApiError_1.default(500, content));
        }
    };
};
exports.default = ErrorCatcher;
