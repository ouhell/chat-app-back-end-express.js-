const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  sender: { type: mongoose.Types.ObjectId, required: true, immutable: true },

  conversation: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    required: true,
  },
  sent_date: { type: Date, default: () => Date.now(), immutable: true },
  edited_date: Date,
  message: { type: String },
  content: { type: String },
  content_type: { type: String, required: true },
  hidden: { type: Boolean, default: false },
});

module.exports = mongoose.model("messages", MessageSchema);
