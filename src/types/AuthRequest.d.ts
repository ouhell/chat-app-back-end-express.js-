import { Request } from "express";

export type AuthRequest = Request & { userInfo: { _id: string; role: string } };
