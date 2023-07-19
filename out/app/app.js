"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const authenticationRoutes_1 = __importDefault(require("../routes/authenticationRoutes"));
const userRoutes_1 = __importDefault(require("../routes/userRoutes"));
const messageRoutes_1 = __importDefault(require("../routes/messageRoutes"));
const ApiErrorHandler_1 = __importDefault(require("../error/ApiErrorHandler"));
const app = (0, express_1.default)();
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json()); // for parsing request body json files
//SETUP CORS ALLOWS
app.use((0, cors_1.default)());
//
// SETUP PRE HANDLERS
const AuthentificationHandler_1 = require("../auth/AuthentificationHandler");
/*
  URL CORRECTOR  "remove last /"
 const UrlHandler = require("./handlers/UrlHandler");
app.use(UrlHandler);
 */
app.use(AuthentificationHandler_1.AuthenticationHandler);
//
// SETUP PROTECTED PATHS
(0, AuthentificationHandler_1.protectPath)("/api/*");
// SETUP ALLOWED PATHS (order is important)
(0, AuthentificationHandler_1.allowPath)("/api/auth/*");
//
// SETUP REQUIRED ROLES (order is important)
//
// SETUP ROUTERS
app.use("/api/auth", authenticationRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
//
//
app.use(express_1.default.static(path_1.default.join(__dirname, "..", "..", "public")));
app.all("/api/*", (req, res) => {
    res.status(404).send("CANNOT FIND END POINT : " + req.url);
});
app.get("*", (_, res) => {
    res.sendFile(path_1.default.join(__dirname, "..", "..", "public", "index.html"));
});
// SETUP ERROR HANDLERS
app.use(ApiErrorHandler_1.default);
exports.default = app;
