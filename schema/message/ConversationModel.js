const mongoose = require("mongoose");

const ConverstionSchema = mongoose.Schema({
  identifier: { type: String, required: true },
  users: [{ type: mongoose.Types.ObjectId }],
  blocked: [{ type: mongoose.Types.ObjectId }],
  creation_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("conversations", ConverstionSchema);
