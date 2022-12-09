const mongoose = require("mongoose");

const ConverstionSchema = mongoose.Schema({
  identifier: { type: String, required: true, indexed: true },
  users: [
    {
      _id: { type: mongoose.Types.ObjectId, required: true },
      username: { type: String, required: true },
      personal_name: { type: String, required: true },
    },
  ],
  blocked: [{ type: mongoose.Types.ObjectId }],
  creation_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("conversations", ConverstionSchema);
