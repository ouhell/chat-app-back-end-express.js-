const jwt = require("jsonwebtoken");
const ApiError = require("../error/ApiError");

const allowed_paths = []; //hold paths allowed without authentification
const role_dependant_paths = []; // hold paths that need certain roles to proceed
function allowPath(path) {
  if (!path.trim()) return;
  allowed_paths.push(path);
}

function bindRole(path, ...roles) {
  if (!path.trim()) return;
  if (!roles || roles.length === 0) return;
  role_dependant_paths.push({
    path: path,
    roles: roles,
  });
}

function checkAllowed(path) {
  let isAllowed = false;
  allowed_paths.forEach((allowedPath) => {
    if (comparePaths(path, allowedPath)) {
      isAllowed = true;
      return;
    }
  });
  return isAllowed;
}
function isRoleAllowed(path, role) {
  let isAllowed = true;
  role_dependant_paths.forEach((dependance) => {
    if (comparePaths(path, dependance.path)) {
      isAllowed = dependance.roles.includes(role);
      return;
    }
  });
}

function comparePaths(excatPath, pathModel) {
  // see if string end with *
  if (pathModel.endsWith("/*")) {
    // only compare relative path
    return (
      excatPath.substr(0, pathModel.length - 2) ==
      pathModel.substr(0, pathModel.length - 2)
    );
  }
  // else compare everything
  return pathModel == excatPath;
}

function AuthentificationHandler(req, res, next) {
  if (checkAllowed(req.url)) return next(); // if path is allowed without authentification
  const authorization = req.headers.authorization;

  const authToken = authorization && authorization.split(" ")[1];
  if (!authToken) return next(ApiError.unauthorized("no authorization token"));
  jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, userinfo) => {
    if (err) return next(ApiError.forbidden("faulty access token"));
    if (!isRoleAllowed(req.url, userinfo.role))
      return next(ApiError.forbidden("role permission denied"));
    req.userinfo = userinfo;
    next();
  });
}

module.exports = { AuthentificationHandler, allowPath, bindRole };
