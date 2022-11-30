const express = require("express");

const app = express();

app.use(express.json()); // for parsing request body json files

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
        connectToDatabase(app), 6000;
      });
    });
}

function startServer(app) {
  const PORT = 5000;
  app.listen(PORT, () => {
    console.log(`SERVER STARTED AT PORT ${PORT} ::`);
  });
}
