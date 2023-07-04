import { NextFunction, Request, Response } from "express";

const UrlHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.url.endsWith("/") && req.url.length > 1) {
    req.url = req.url.substr(0, req.url.length - 1);
  }
  next();
};

export default UrlHandler;
