class ApiError {
  code: number;
  message: string;
  servedError: boolean;
  isValidationError: boolean;
  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
    this.servedError = true;
    this.isValidationError = false;
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }
  static notFound(message: string) {
    return new ApiError(404, message);
  }

  static internal(message: string) {
    return new ApiError(500, message);
  }

  static unauthorized(message: string) {
    return new ApiError(401, message);
  }
  static forbidden(message: string) {
    return new ApiError(403, message);
  }

  setValidation(value: boolean) {
    this.isValidationError = value;
    return this;
  }
}

export default ApiError;
