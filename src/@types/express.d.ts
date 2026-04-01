import { Namespace } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      userInfo: { _id: string; role: string };
    }
  }
}

export {};
