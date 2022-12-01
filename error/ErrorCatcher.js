const ApiError = require("./ApiError");

const ErrorCatcher = (handlerFunction) => {
  return async (req, res, next) => {
    try {
      await handlerFunction(req, res, next);
    } catch (err) {
      console.error("catched unexpected error : \n", err, "\n");
      let message = err.keyPattern ? err.message : "internal server error";
      next(new ApiError(500, message));
    }
  };
};

module.exports = ErrorCatcher;
