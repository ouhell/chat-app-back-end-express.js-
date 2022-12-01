const ApiError = require("./ApiError");

const ErrorCatcher = (handlerFunction) => {
  return async (req, res, next) => {
    try {
      await handlerFunction(req, res, next);
    } catch (err) {
      console.error(
        "catched unexpected error : ",
        "named : ",
        err.name,
        "\n",
        err,
        "\n"
      );
      let content = "internal server error";

      if (err.name === "ValidationError") {
        let errors = {};

        Object.keys(err.errors).forEach((key) => {
          errors[key] = err.errors[key].message;
        });
        content = errors;
      }
      next(new ApiError(500, content));
    }
  };
};

module.exports = ErrorCatcher;
