import { Schema, Types, model } from "mongoose";
import { Message } from "../../types/schemas";

const MessageSchema = new Schema<Message>({
  sender: { type: Types.ObjectId, required: true, immutable: true },
  conversation: {
    type: Types.ObjectId,
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

export default model("messages", MessageSchema);
