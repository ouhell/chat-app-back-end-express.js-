require("dotenv").config();
const express = require("express");

const app = express();

app.use(express.json()); // for parsing request body json files

// SETUP PRE HANDLERS
const {
  AuthentificationHandler,
  allowPath,
  bindRole,
} = require("./auth/AuthetificationHandler");

allowPath("/api/auth/*");
bindRole("/api/*", "DOCTOR");
app.use(AuthentificationHandler);

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
  res.status(404).send("api endpoint not found");
});

// set up database connection

const mongoose = require("mongoose");

connectToDatabase(app); // it all start

function connectToDatabase(app) {
  const URI =
    "mongodb+srv://ouhell:konoDIOda@main.dmseklc.mongodb.net/main?retryWrites=true&w=majority";
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
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}
