import dotenv from "dotenv"
import express , {Express} from 'express'
import app from "./src/app/app" 
import server from "./src/connection/server/server"
import mongoose from "mongoose"

/* app.all("*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
}); */

//setupt socket

dotenv.config();


const socketio = require("./src/connection/sockets/socket");

// set up database connection


connectToDatabase(app); // it all start

function connectToDatabase(app : Express) {
  const URI = process.env.DATABASE_CONNECTION_URI as string;
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

function startServer(app : Express) {
  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}
