import { Schema, Types, model } from "mongoose";

interface Request {
  requester: typeof Types.ObjectId;
  destinator: typeof Types.ObjectId;
  date: Date;
}

const RequestSchema = new Schema<Request>({
  requester: { type: Types.ObjectId, required: true },
  destinator: { type: Types.ObjectId, required: true },
  date: { type: Date, default: Date.now },
});

export default model("request", RequestSchema);
