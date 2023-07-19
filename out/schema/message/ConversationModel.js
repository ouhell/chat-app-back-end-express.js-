"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ConversationSchema = new mongoose_1.Schema({
    identifier: { type: String, required: true },
    users: [{ type: mongoose_1.Types.ObjectId }],
    blocked: [{ type: mongoose_1.Types.ObjectId }],
    blackList: [{ type: mongoose_1.Types.ObjectId }],
    lockedInvite: { type: Boolean, default: false },
    admins: [mongoose_1.Types.ObjectId],
    creation_date: { type: Date, default: Date.now },
    name: String,
});
exports.default = (0, mongoose_1.model)("conversations", ConversationSchema);
