import { Response, Request, NextFunction } from "express";
import mongoose, { HydratedDocument } from "mongoose";

import UserModel from "../schema/user/UserModel";
import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError";
import EncryptionHandler from "../security/EncryptionHandler";
import axios from "axios";
import { User } from "../types/schemas";
import { generateRandomNumber, writeErrorLog } from "../util/general";
import { AxiosError } from "axios";

type Token = {
  value: string;
  expiresAt: number;
};

const createJwtFromUser = (user: HydratedDocument<User>): [Token, Token] => {
  const accessExpiresInMs = 1000 * 60 * 15; // 15 min
  const refreshExpiresInMs = 1000 * 60 * 60 * 24 * 7; // 7 days
  const accessExpiresAt = Date.now() + accessExpiresInMs;
  const refreshExpiresAt = Date.now() + refreshExpiresInMs;
  const accessSecret = process.env.ACCESS_TOKEN_SECRET as string;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
  const access_token: Token = {
    value: jwt.sign(
      {
        _id: user._id,
        role: user.role,
        type: "access",
        expiresAt: accessExpiresAt,
      },
      accessSecret,
      {
        expiresIn: "15m",
      },
    ),
    expiresAt: accessExpiresAt,
  };

  const refreshToken: Token = {
    value: jwt.sign(
      {
        _id: user._id,
        role: user.role,
        type: "refresh",
        expiresAt: refreshExpiresAt,
      },
      refreshSecret,
      {
        expiresIn: "7d",
      },
    ),
    expiresAt: refreshExpiresAt,
  };
  return [access_token, refreshToken];
};

const authenticateUser = (user: HydratedDocument<User>, res: Response) => {
  const [access_token, refresh_token] = createJwtFromUser(user);
  const isProduction = process.env.environment === "production";
  const sameSite: "lax" | "none" = isProduction ? "none" : "lax";

  res.cookie("accessToken", access_token.value, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
    maxAge: 1000 * 60 * 15,
  });

  res.cookie("refreshToken", refresh_token.value, {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return {
    access_token,
    refresh_token,
    userId: user._id,
    userRole: user.role,
    username: user.username,
    profile_picture: user.profile_picture,
  };
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const identifier = req.body.identifier; // username or email
  const password = req.body.password;
  const user = await UserModel.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });
  // if user with given username or email does not exist in the database
  if (!user) {
    next(ApiError.unauthorized(`incorrect username`));

    return;
  }
  // if password does not match
  if (EncryptionHandler.decrypt(user.password) !== password) {
    next(ApiError.unauthorized(`incorrect password`));
    return;
  }

  return res.status(200).json(authenticateUser(user, res));
};

export const oauthLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id_token } = req.body;

    const googleresp = await axios({
      url: `https://oauth2.googleapis.com/tokeninfo`,
      params: {
        id_token,
      },
      method: "get",
    });

    const googleData = googleresp.data;

    const existingUser = await UserModel.findOne({
      provider: "google",
      email: googleData.email,
    });

    if (existingUser) {
      return res.status(200).json(authenticateUser(existingUser, res));
    } else {
      const createdUser = await UserModel.create({
        email: googleData.email,
        username: googleData.given_name + generateRandomNumber(),
        personal_name: googleData.name,
        profile_picture: googleData.picture,
        provider: "google",
        password: EncryptionHandler.encrypt(crypto.randomUUID()),
      });
      return res.status(201).json(authenticateUser(createdUser, res));
    }
  } catch (e) {
    if (e instanceof AxiosError) {
    }
    console.log("google token err :::", e);
    writeErrorLog(e);
    return next(ApiError.unauthorized("unable to reach to google account"));
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let { username, personal_name, password, email } = req.body;
  password = EncryptionHandler.encrypt(password);
  const user = new UserModel({ username, personal_name, password, email });

  const createdUser = await user.save();

  return res.status(201).json(authenticateUser(createdUser, res));
};

export const checkEmailExistance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const checkEmail = req.params.value;
  const email = await UserModel.exists({
    email: checkEmail,
  });
  if (email) return res.status(200).json(true);

  return res.status(200).json(false);
};

export const checkUsernameExistance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const checkUsername = req.params.value;
  const username = await UserModel.exists({
    username: checkUsername,
  });
  if (username) return res.status(200).json(true);

  return res.status(200).json(false);
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
  const authHeaderToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : undefined;
  const tokenFromBody = req.body?.refreshToken as string | undefined;
  const refreshTokenValue = tokenFromCookie || tokenFromBody || authHeaderToken;

  if (!refreshTokenValue)
    return next(ApiError.forbidden("no refresh token was provided"));

  jwt.verify(
    refreshTokenValue,
    process.env.REFRESH_TOKEN_SECRET as string,
    async (err, val) => {
      if (err) return next(ApiError.forbidden("expired token"));
      const userData = val as { _id: string; role: string; type: string };
      if (userData.type !== "refresh")
        return next(ApiError.forbidden("not a refresh token"));

      const user = await UserModel.findById(
        new mongoose.Types.ObjectId(userData._id),
      );

      if (!user) return next(ApiError.notFound("user not found"));

      return res.json(authenticateUser(user, res));
    },
  );
};
