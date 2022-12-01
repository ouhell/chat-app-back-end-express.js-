class ApiError {
  constructor(code, message) {
    this.code = code;
    this.message = message;
    this.servedError = true;
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static internal(message) {
    return new ApiError(500, message);
  }

  static unauthorized(message) {
    return new ApiError(401, message);
  }
  static forbidden(message) {
    return new ApiError(403, message);
  }
}

module.exports = ApiError;
