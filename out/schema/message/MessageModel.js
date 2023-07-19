"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const MessageSchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Types.ObjectId, required: true, immutable: true },
    conversation: {
        type: mongoose_1.Types.ObjectId,
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
exports.default = (0, mongoose_1.model)("messages", MessageSchema);
