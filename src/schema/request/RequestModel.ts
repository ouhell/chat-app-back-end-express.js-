import { Schema, Types, model } from "mongoose";
import { Request } from "../../types/schemas";
const RequestSchema = new Schema<Request>({
  requester: { type: Types.ObjectId, required: true },
  destinator: { type: Types.ObjectId, required: true },
  date: { type: Date, default: Date.now },
});

export default model("request", RequestSchema);
