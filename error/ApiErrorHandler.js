const ApiError = require("./ApiError");

const ApiErrorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    res.status(err.code).json(err);
    return;
  }
  console.log("ApiErrorHandler passed error : ", err);
  res.status(500).json(new ApiError(500, "internal server error"));
};

module.exports = ApiErrorHandler;
