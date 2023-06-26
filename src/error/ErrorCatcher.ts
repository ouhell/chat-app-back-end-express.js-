import { NextFunction, Request, Response } from "express";
import ApiError from "./ApiError";

const ErrorCatcher = (
  handlerFunction: (req: Request, res: Response, next: NextFunction) => void
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
