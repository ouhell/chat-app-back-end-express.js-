require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

app.use(express.json()); // for parsing request body json files

//SETUP CORS ALLOWS
app.use(cors("*"));
//

module.exports = app;
