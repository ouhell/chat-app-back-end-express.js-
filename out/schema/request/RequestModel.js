"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RequestSchema = new mongoose_1.Schema({
    requester: { type: mongoose_1.Types.ObjectId, required: true },
    destinator: { type: mongoose_1.Types.ObjectId, required: true },
    date: { type: Date, default: Date.now },
});
exports.default = (0, mongoose_1.model)("request", RequestSchema);
