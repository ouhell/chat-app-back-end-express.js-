const mongoose = require("mongoose");

const RequestSchema = mongoose.Schema({
  requester: { type: mongoose.Types.ObjectId, required: true },
  destinator: { type: mongoose.Types.ObjectId, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("request", RequestSchema);
