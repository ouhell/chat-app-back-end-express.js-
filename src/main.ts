import dotenv from "dotenv";
dotenv.config();
import { Express } from "express";
import app from "./app/app";
import server from "./connection/server/server";
import mongoose from "mongoose";

/* app.all("*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
}); */

//setupt socket

import io from "./connection/sockets/sockets";

console.log(io._connectTimeout);

// set up database connection

function connectToDatabase(app: Express) {
  const URI = process.env.DATABASE_CONNECTION_URI as string;
  mongoose
    .connect(URI)
    .then(() => {
      console.log("MONGODB CONNECTED ::");
      startServer();
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

function startServer() {
  const PORT = process.env.PORT;
  server.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}

connectToDatabase(app); // it all start
