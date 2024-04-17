import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import morgan from "morgan";
import AuthenticationRouter from "../routes/authenticationRoutes";
import UserRouter from "../routes/userRoutes";
import MessageRouter from "../routes/messageRoutes";
import ApiErrorHandler from "../error/ApiErrorHandler";

const app = express();

if (process.env.environment === "development") {
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
import { BASE_PATH, SOURCE_PATH } from "../util/path";

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
app.use(express.static(path.join(__dirname, "..", "..", "public", "dist")));
app.get("/debug", async (req, res) => {
  try {
    const file = fs.readFileSync(path.join(BASE_PATH, "error.json"), {
      // flag: "a",
    });

    return res.status(200).json(JSON.parse(file.toString()));
  } catch (e) {
    return res.status(500).send("error while reading the file");
  }

  // return res.json({
  //   test: true,
  // });
});

app.post("/debug/create", async (req, res) => {
  try {
    console.log("writing");
    const data = {
      error: "written",
    };
    fs.writeFileSync(path.join(BASE_PATH, "error.json"), JSON.stringify(data));

    return res.status(200).send();
  } catch (e) {
    console.log("error ::::::::: writing");
    return res.status(500).send("error while WRITING the file");
  }

  // return res.json({
  //   test: true,
  // });
});
app.all("/api/*", (req: Request, res: Response) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
});

app.get("*", (_, res: Response) => {
  res.sendFile(
    path.join(__dirname, "..", "..", "public", "dist", "index.html")
  );
});
// SETUP ERROR HANDLERS

app.use(ApiErrorHandler);

export default app;
