"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    username: { type: String, required: true, unique: true },
    personal_name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    black_listed_users: [mongoose_1.Types.ObjectId],
    groups: [mongoose_1.Types.ObjectId],
    isEnabled: { type: Boolean, default: true },
    profile_picture: String,
    role: {
        type: String,
        default: "USER",
        enum: {
            values: ["USER", "ADMIN"],
            message: "role {VALUE} is not supported",
        },
    },
});
exports.default = (0, mongoose_1.model)("users", UserSchema);
