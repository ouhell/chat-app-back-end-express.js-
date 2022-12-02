const mongoose = require("mongoose");

const MessageSchema = mongoose.Schema({
  sender: { type: mongoose.Types.ObjectId, required: true, immutable: true },
  conversation: {
    type: String,
    required: true,
    immutable: true,
  },
  sent_date: { type: Date, default: () => Date.now(), immutable: true },
  edited_date: Date,
  content: { type: Object, required: true },
  content_type: { type: String, required: true },
  file_name: String,
  hidden: { type: Boolean, default: false },
});

module.exports = mongoose.model("messages", MessageSchema);
