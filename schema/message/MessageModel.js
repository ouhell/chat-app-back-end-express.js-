const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  sender: { type: mongoose.Types.ObjectId, required: true, immutable: true },

  conversation: {
    type: mongoose.Types.ObjectId,
    required: true,
    immutable: true,
  },
  sent_date: { type: Date, default: () => Date.now(), immutable: true },
  edited_date: Date,
  message: { type: String },
  content: { type: Object },
  content_type: { type: String, required: true },
  file_name: String,
  hidden: { type: Boolean, default: false },
});

module.exports = mongoose.model("messages", MessageSchema);
