"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app/app"));
const server_1 = __importDefault(require("./connection/server/server"));
const mongoose_1 = __importDefault(require("mongoose"));
/* app.all("*", (req, res) => {
  res.status(404).send("CANNOT FIND END POINT : " + req.url);
}); */
//setupt socket
const sockets_1 = __importDefault(require("./connection/sockets/sockets"));
console.log(sockets_1.default._connectTimeout);
// set up database connection
function connectToDatabase(app) {
    const URI = process.env.DATABASE_CONNECTION_URI;
    mongoose_1.default
        .connect(URI)
        .then(() => {
        console.log("MONGODB CONNECTED ::");
        startServer();
    })
        .catch((err) => {
        console.log("MONGO DATABASE COULD NOT CONNECT : ", err, "\n RETRYING IN 5 SECONDS");
        setTimeout(() => {
            connectToDatabase(app);
        }, 5000);
    });
}
function startServer() {
    const PORT = process.env.PORT;
    server_1.default.listen(PORT, () => {
        console.log(`SERVER STARTED AT PORT ${PORT} ::`);
    });
}
connectToDatabase(app_1.default); // it all start
