import jwt from "jsonwebtoken";
import ApiError from "../error/ApiError";
import { NextFunction, Request, Response } from "express";

type Allowance = {
  path: string;
  methods: string[];
};

type Dependence = {
  path: string;
  roles: string[];
};
const METHOD_SIGNATURES = ["GET", "POST", "PUT", "DELETE"];
const protected_paths: string[] = []; // hold paths that need authentification to access
const allowed_paths: Allowance[] = []; //hold protected paths allowed without authentification
const role_dependant_paths: Dependence[] = []; // hold paths that need certain roles to proceed

export function protectPath(path: string) {
  if (!path.trim()) return;
  if (protected_paths.includes(path)) return;

  protected_paths.push(path);
}

export function allowPath(path: string, ...methods: string[]) {
  if (!path.trim()) return;
  if (allowed_paths.find((allow) => allow.path === path)) return;

  methods = methods
    .map((method) => method.toUpperCase())
    .filter((method) => METHOD_SIGNATURES.includes(method));

  allowed_paths.push({ path, methods });
}

export function bindRole(path: string, ...roles: string[]) {
  if (!path.trim()) return;
  if (!roles || roles.length === 0) return;
  role_dependant_paths.push({
    path: path,
    roles: roles,
  });
}

function checkProtected(path: string) {
  let isProtected = false;
  for (let protectedPath of protected_paths) {
    if (comparePaths(path, protectedPath)) {
      isProtected = true;
      break;
    }
  }

  return isProtected;
}

function checkAllowed(path: string, method: string) {
  let isAllowed = false;
  for (let allowedPath of allowed_paths) {
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
function isRoleAllowed(path: string, role: string) {
  let isAllowed = true;
  for (let dependance of role_dependant_paths) {
    if (comparePaths(path, dependance.path)) {
      isAllowed = dependance.roles.includes(role);
      break;
    }
  }
  return isAllowed;
}

function comparePaths(exactPath: string, pathModel: string) {
  // see if string end with *
  if (pathModel.endsWith("/*")) {
    // only compare relative path
    return (
      exactPath.substr(0, pathModel.length - 2) ==
      pathModel.substr(0, pathModel.length - 2)
    );
  }
  // else compare everything
  return pathModel === exactPath;
}

export function AuthenticationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!checkProtected(req.url)) return next();
  if (checkAllowed(req.url, req.method)) return next(); // if path is allowed without authentification
  const authorization = req.headers.authorization;

  const authToken = authorization && authorization.split(" ")[1];
  if (!authToken) return next(ApiError.unauthorized("no authorization token"));
  jwt.verify(
    authToken,
    process.env.ACCESS_TOKEN_SECRET as string,
    (err, userinfo) => {
      if (err) return next(ApiError.forbidden("faulty access token"));
      userinfo = userinfo as { _id: string; role: string };
      if (!isRoleAllowed(req.url, userinfo.role))
        return next(ApiError.forbidden("role permission denied"));
      // @ts-ignore
      req.userInfo = userinfo;

      next();
    }
  );
}
