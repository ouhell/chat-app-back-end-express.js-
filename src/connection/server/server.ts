import app from "../../app/app";
import http from "http"

const server = http.createServer(app);

export default server;
