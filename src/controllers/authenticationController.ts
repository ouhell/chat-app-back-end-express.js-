import { Response, Request, NextFunction } from "express";
import UserModel from "../schema/user/UserModel";
import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError";
import EncryptionHandler from "../security/EncryptionHandler";

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

  const access_token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET as string
  );

  res.status(200).json({
    access_token,
    userId: user._id,
    userRole: user.role,
    username: user.username,
    profile_picture: user.profile_picture,
  });
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

  return res.status(201).json(createdUser);
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
