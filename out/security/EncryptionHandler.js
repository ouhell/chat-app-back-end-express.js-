"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _EncryptionHandler_algorithm, _EncryptionHandler_initVectorString, _EncryptionHandler_SecurityKeyString, _EncryptionHandler_initVector, _EncryptionHandler_SecurityKey;
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
class EncryptionHandler {
    static encrypt(text) {
        const cipher = crypto_1.default.createCipheriv(__classPrivateFieldGet(this, _a, "f", _EncryptionHandler_algorithm), __classPrivateFieldGet(this, _a, "f", _EncryptionHandler_SecurityKey), __classPrivateFieldGet(this, _a, "f", _EncryptionHandler_initVector));
        let encryptedData = cipher.update(text, "utf-8", "hex");
        encryptedData += cipher.final("hex");
        return encryptedData;
    }
    static decrypt(text) {
        const decipher = crypto_1.default.createDecipheriv(__classPrivateFieldGet(this, _a, "f", _EncryptionHandler_algorithm), __classPrivateFieldGet(this, _a, "f", _EncryptionHandler_SecurityKey), __classPrivateFieldGet(this, _a, "f", _EncryptionHandler_initVector));
        let decryptedData = decipher.update(text, "hex", "utf-8");
        decryptedData += decipher.final("utf8");
        return decryptedData;
    }
}
_a = EncryptionHandler;
_EncryptionHandler_algorithm = { value: "aes-256-cbc" };
_EncryptionHandler_initVectorString = { value: process.env.CRYPTING_VECTOR };
_EncryptionHandler_SecurityKeyString = { value: process.env.CRYPTING_SECURITY_KEY };
_EncryptionHandler_initVector = { value: Buffer.from(__classPrivateFieldGet(_a, _a, "f", _EncryptionHandler_initVectorString), "hex") };
_EncryptionHandler_SecurityKey = { value: Buffer.from(__classPrivateFieldGet(_a, _a, "f", _EncryptionHandler_SecurityKeyString), "hex") };
exports.default = EncryptionHandler;
