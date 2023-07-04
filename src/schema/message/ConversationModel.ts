import { Schema, model, Types } from "mongoose";
import { Conversation } from "../../types/schemas";

const ConversationSchema = new Schema<Conversation>({
  identifier: { type: String, required: true },
  users: [{ type: Types.ObjectId }],
  blocked: [{ type: Types.ObjectId }],
  blackList: [{ type: Types.ObjectId }],
  lockedInvite: { type: Boolean, default: false },
  admins: [Types.ObjectId],
  creation_date: { type: Date, default: Date.now },
  name: String,
});

export default model("conversations", ConversationSchema);
