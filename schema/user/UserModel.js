const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  personal_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contacts: [
    {
      contact_id: { type: mongoose.Types.ObjectId, required: true },
      conversation: { type: String, required: true },
      blocked: { type: Boolean, default: false },
    },
  ],
  black_listed_users: [mongoose.Types.ObjectId],
  friend_requests: [
    {
      sender: mongoose.Types.ObjectId,
      sent_date: Date,
    },
  ],
  groups: [mongoose.Types.ObjectId],
  isEnabled: { type: String, default: true },
  profile_picture: mongoose.Types.ObjectId,
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
