const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  personal_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  black_listed_users: [mongoose.Types.ObjectId],

  groups: [mongoose.Types.ObjectId],
  isEnabled: { type: String, default: true },
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

module.exports = mongoose.model("users", UserSchema);
