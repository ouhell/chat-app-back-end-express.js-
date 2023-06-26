import { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError";

const ErrorCatcher = (
  handlerFunction: (req: any, res: any, next: NextFunction) => void
) => {
  return async (req: any, res: any, next: NextFunction) => {
    try {
      await handlerFunction(req, res, next);
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "catched unexpected error : ",
          "named : ",
          err.name,
          "\n",
          err,
          "\n"
        );
      }

      let content: string = "internal server error";

      next(new ApiError(500, content));
    }
  };
};

export default ErrorCatcher;
