import { Schema, model, Types } from "mongoose";
import { User } from "../../types/schemas";

const UserSchema = new Schema<User>({
  username: { type: String, required: true, unique: true },
  personal_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  black_listed_users: [Types.ObjectId],

  groups: [Types.ObjectId],
  isEnabled: { type: Boolean, default: true },
  profile_picture: String,
  role: {
    type: String,
    default: "USER",
    enum: {
      values: ["USER", "ADMIN"],
      message: "role {VALUE} is not supported",
    },
  },
});

export default model("users", UserSchema);
