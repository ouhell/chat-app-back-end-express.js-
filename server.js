require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json()); // for parsing request body json files

//SETUP CORS ALLOWS
app.use(cors("*"));
//

// SETUP PRE HANDLERS
const {
  AuthentificationHandler,
  allowPath,
  bindRole,
} = require("./auth/AuthetificationHandler");
/*
  URL CORRECTOR  "remove last /"
 const UrlHandler = require("./handlers/UrlHandler");
app.use(UrlHandler);
 */
app.use(AuthentificationHandler);
//

// SETUP ALLOWED PATHS (order is important)

allowPath("/api/userapi/users", "post");
allowPath("/api/auth/*");
allowPath("/api/userapi/");
//

// SETUP REQUIRED ROLES (order is important)

//

// SETUP ROUTERS
const AuthentificationController = require("./auth/AuthentficationController");
const UserController = require("./controller/user/UserController");
app.use("/api/auth", AuthentificationController);
app.use("/api/userapi", UserController);
//

// SETUP ERROR HANDLERS
const ApiErrorHandler = require("./error/ApiErrorHandler");
app.use(ApiErrorHandler);

app.all("*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
});

// set up database connection

const mongoose = require("mongoose");

connectToDatabase(app); // it all start

function connectToDatabase(app) {
  const URI = process.env.DATABASE_CONNECTION_URI;
  mongoose
    .connect(URI)
    .then(() => {
      console.log("MONGODB CONNECTED ::");
      startServer(app);
    })
    .catch((err) => {
      console.log(
        "MONGO DATABASE COULD NOT CONNECT : ",
        err,
        "\n RETRYING IN 5 SECONDS"
      );
      setTimeout(() => {
        connectToDatabase(app), 5000;
      });
    });
}

function startServer(app) {
  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}
