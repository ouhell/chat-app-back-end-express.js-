import mongoose from "mongoose";
import ApiError from "../error/ApiError";
import { NextFunction, Request, Response } from "express";

export const validateId = (
  req: Request,
  res: Response,
  next: NextFunction,
  value: string
) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(ApiError.badRequest("invalid id"));
  }
  return next();
};
