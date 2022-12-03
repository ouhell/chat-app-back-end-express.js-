const crypto = require("crypto");

class EncryptionHandler {
  static #algorithm = "aes-256-cbc";
  static #initVectorString = process.env.CRYPTING_VECTOR;
  static #SecuritykeyString = process.env.CRYPTING_SECURITY_KEY;
  static #initVector = Buffer.from(this.#initVectorString, "hex");
  static #Securitykey = Buffer.from(this.#SecuritykeyString, "hex");

  static encrypt(text) {
    const cipher = crypto.createCipheriv(
      this.#algorithm,
      this.#Securitykey,
      this.#initVector
    );
    let encryptedData = cipher.update(text, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return encryptedData;
  }

  static decrypt(text) {
    const decipher = crypto.createDecipheriv(
      this.#algorithm,
      this.#Securitykey,
      this.#initVector
    );
    let decryptedData = decipher.update(text, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    return decryptedData;
  }
}

module.exports = EncryptionHandler;
