const jwt = require("jsonwebtoken");
const ApiError = require("../error/ApiError");
const METHOD_SIGNATURES = ["GET", "POST", "PUT", "DELETE"];
const protected_paths = []; // hold paths that need authentification to access
const allowed_paths = []; //hold protected paths allowed without authentification
const role_dependant_paths = []; // hold paths that need certain roles to proceed

function protectPath(path) {
  if (!path.trim()) return;
  if (protected_paths.includes(path)) return;

  protected_paths.push(path);
}

function allowPath(path, ...methods) {
  if (!path.trim()) return;
  if (allowed_paths.includes(path)) return;

  methods = methods
    .map((method) => method.toUpperCase())
    .filter((method) => METHOD_SIGNATURES.includes(method));

  allowed_paths.push({ path, methods });
}

function bindRole(path, ...roles) {
  if (!path.trim()) return;
  if (!roles || roles.length === 0) return;
  role_dependant_paths.push({
    path: path,
    roles: roles,
  });
}

function checkProtected(path, method) {
  let isProtected = false;
  for (protectedPath of protected_paths) {
    if (comparePaths(path, protectedPath)) {
      isProtected = true;
      break;
    }
  }

  return isProtected;
}

function checkAllowed(path, method) {
  let isAllowed = false;
  for (allowedPath of allowed_paths) {
    if (comparePaths(path, allowedPath.path)) {
      if (allowedPath.methods.length !== 0) {
        if (!allowedPath.methods.includes(method)) continue;
      }
      isAllowed = true;
      break;
    }
  }

  return isAllowed;
}
function isRoleAllowed(path, role) {
  let isAllowed = true;
  for (dependance of role_dependant_paths) {
    if (comparePaths(path, dependance.path)) {
      isAllowed = dependance.roles.includes(role);
      break;
    }
  }
  return isAllowed;
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
  if (!checkProtected(req.url)) return next();
  if (checkAllowed(req.url, req.method)) return next(); // if path is allowed without authentification
  const authorization = req.headers.authorization;

  const authToken = authorization && authorization.split(" ")[1];
  if (!authToken) return next(ApiError.unauthorized("no authorization token"));
  jwt.verify(authToken, process.env.ACCESS_TOKEN_SECRET, (err, userinfo) => {
    if (err) return next(ApiError.forbidden("faulty access token"));
    if (!isRoleAllowed(req.url, userinfo.role))
      return next(ApiError.forbidden("role permission denied"));
    req.userInfo = userinfo;
    next();
  });
}

module.exports = { AuthentificationHandler, allowPath, bindRole, protectPath };
