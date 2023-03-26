require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

if (process.env.NODE_ENV == "developement") {
  app.use(morgan("dev"));
}

app.use(express.json()); // for parsing request body json files

//SETUP CORS ALLOWS
app.use(cors("*"));
//

// SETUP PRE HANDLERS
const {
  AuthentificationHandler,
  protectPath,
  allowPath,
  bindRole,
} = require("../auth/AuthetificationHandler");
/*
  URL CORRECTOR  "remove last /"
 const UrlHandler = require("./handlers/UrlHandler");
app.use(UrlHandler);
 */

app.use(AuthentificationHandler);
//

// SETUP PROTECTED PATHS
protectPath("/api/*");

// SETUP ALLOWED PATHS (order is important)

allowPath("/api/auth/*");

//

// SETUP REQUIRED ROLES (order is important)

//

// SETUP ROUTERS
const authRouter = require("../routes/authenticationRoutes");
const userRouter = require("../routes/userRoutes");
const messageRouter = require("../routes/messageRoutes");
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/messages", messageRouter);
//

//
app.use(express.static(path.join(__dirname, "..", "public")));

app.all("/api/*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// SETUP ERROR HANDLERS
const ApiErrorHandler = require("../error/ApiErrorHandler");

app.use(ApiErrorHandler);

module.exports = app;
