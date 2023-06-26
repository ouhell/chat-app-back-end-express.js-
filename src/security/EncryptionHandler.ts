import crypto from "crypto";

class EncryptionHandler {
  static #algorithm = "aes-256-cbc";
  static #initVectorString = process.env.CRYPTING_VECTOR as string;
  static #SecurityKeyString = process.env.CRYPTING_SECURITY_KEY as string;
  static #initVector = Buffer.from(this.#initVectorString, "hex");
  static #SecurityKey = Buffer.from(this.#SecurityKeyString, "hex");

  static encrypt(text: string) {
    const cipher = crypto.createCipheriv(
      this.#algorithm,
      this.#SecurityKey,
      this.#initVector
    );
    let encryptedData = cipher.update(text, "utf-8", "hex");
    encryptedData += cipher.final("hex");
    return encryptedData;
  }

  static decrypt(text: string) {
    const decipher = crypto.createDecipheriv(
      this.#algorithm,
      this.#SecurityKey,
      this.#initVector
    );
    let decryptedData = decipher.update(text, "hex", "utf-8");
    decryptedData += decipher.final("utf8");
    return decryptedData;
  }
}

export default EncryptionHandler;
