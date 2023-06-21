const { default: mongoose } = require("mongoose");
const ApiError = require("../error/ApiError");

exports.validateId = (req, res, next, value) => {
  
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return next(ApiError.badRequest("invalid id"));
  }
  return next();
};
