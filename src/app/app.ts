import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import AuthenticationRouter from "../routes/authenticationRoutes";
import UserRouter from "../routes/userRoutes";
import MessageRouter from "../routes/messageRoutes";
import ApiErrorHandler from "../error/ApiErrorHandler";

const app = express();

if (process.env.NODE_ENV == "developement") {
  app.use(morgan("dev"));
}

app.use(express.json()); // for parsing request body json files

//SETUP CORS ALLOWS
app.use(cors());
//

// SETUP PRE HANDLERS
import {
  AuthenticationHandler,
  protectPath,
  allowPath,
} from "../auth/AuthentificationHandler";

/*
  URL CORRECTOR  "remove last /"
 const UrlHandler = require("./handlers/UrlHandler");
app.use(UrlHandler);
 */

app.use(AuthenticationHandler);
//

// SETUP PROTECTED PATHS
protectPath("/api/*");

// SETUP ALLOWED PATHS (order is important)

allowPath("/api/auth/*");

//

// SETUP REQUIRED ROLES (order is important)

//

// SETUP ROUTERS

app.use("/api/auth", AuthenticationRouter);
app.use("/api/users", UserRouter);
app.use("/api/messages", MessageRouter);
//

//
app.use(express.static(path.join(__dirname, "..", "public")));

app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
});

app.get("*", (_, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// SETUP ERROR HANDLERS

app.use(ApiErrorHandler);

export default app;
