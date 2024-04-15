import { Response, Request, NextFunction } from "express";
import { HydratedDocument } from "mongoose";

import UserModel from "../schema/user/UserModel";
import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError";
import EncryptionHandler from "../security/EncryptionHandler";
import axios from "axios";
import { User } from "../types/schemas";
import { generateRandomNumber } from "../util/general";

const createJwtFromUser = (user: HydratedDocument<User>): string => {
  const access_token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET as string
  );
  return access_token;
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
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

  const access_token = createJwtFromUser(user);

  res.status(200).json({
    access_token,
    userId: user._id,
    userRole: user.role,
    username: user.username,
    profile_picture: user.profile_picture,
  });
};

export const oauthLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
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
    let access_token = null;

    const existingUser = await UserModel.findOne({
      provider: "google",
      email: googleData.email,
    });

    if (existingUser) {
      access_token = createJwtFromUser(existingUser);
      return res.status(200).json({
        access_token,
        userId: existingUser._id,
        userRole: existingUser.role,
        username: existingUser.username,
        profile_picture: existingUser.profile_picture,
      });
    } else {
      const createdUser = await UserModel.create({
        email: googleData.email,
        username: googleData.given_name + generateRandomNumber(),
        personal_name: googleData.name,
        profile_picture: googleData.picture,
        provider: "google",
        password: EncryptionHandler.encrypt(crypto.randomUUID()),
      });
      access_token = createJwtFromUser(createdUser);
      return res.status(201).json({
        access_token,
        userId: createdUser._id,
        userRole: createdUser.role,
        username: createdUser.username,
        profile_picture: createdUser.profile_picture,
      });
    }
  } catch (e) {
    return next(ApiError.unauthorized("unable to reach to google account"));
  }
};

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { username, personal_name, password, email } = req.body;
  password = EncryptionHandler.encrypt(password);
  const user = new UserModel({ username, personal_name, password, email });

  const createdUser = await user.save();
  const access_token = createJwtFromUser(createdUser);
  return res.status(201).json({
    access_token,
    userId: createdUser._id,
    userRole: createdUser.role,
    username: createdUser.username,
    profile_picture: createdUser.profile_picture,
  });
};

export const checkEmailExistance = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
) => {
  const checkUsername = req.params.value;
  const username = await UserModel.exists({
    username: checkUsername,
  });
  if (username) return res.status(200).json(true);

  return res.status(200).json(false);
};
