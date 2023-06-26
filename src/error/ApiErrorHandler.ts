import ApiError from "./ApiError";
import { Request, Response, NextFunction } from "express";
const ApiErrorHandler = (
  err: ApiError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    res.status(err.code).json(err);
    return;
  }
  console.log("ApiErrorHandler passed error : ", err);
  res.status(500).json(new ApiError(500, "internal server error"));
};

export default ApiErrorHandler;
