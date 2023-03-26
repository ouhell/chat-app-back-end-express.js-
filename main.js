require("dotenv").config();
const express = require("express");

const app = require("./src/app/app");
const server = require("./src/connection/server/server");

/* app.all("*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
}); */

//setupt socket

const socketio = require("./src/connection/sockets/socket");

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
        connectToDatabase(app);
      }, 5000);
    });
}

function startServer(app) {
  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}
