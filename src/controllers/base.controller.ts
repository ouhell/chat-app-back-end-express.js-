import { NextFunction, Request, Response } from "express";

export abstract class BaseController {
  async handleRequest(
    req: Request,
    res: Response,
    next: NextFunction,
    fn: () => Promise<any>,
    status: number = 200,
  ) {
    try {
      const result = await fn();
      return res.status(status).json(result);
    } catch (error) {
      next(error);
    }
  }
}
