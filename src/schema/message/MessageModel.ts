import { Schema, Types, model } from "mongoose";

interface Message {
  sender: typeof Types.ObjectId;
  conversation: typeof Types.ObjectId;
  sent_date: Date;
  edited_date: Date | undefined;
  message: string;
  content: string;
  content_type: string;
  hidden: boolean;
}

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
