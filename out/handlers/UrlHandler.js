"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UrlHandler = (req, res, next) => {
    if (req.url.endsWith("/") && req.url.length > 1) {
        req.url = req.url.substr(0, req.url.length - 1);
    }
    next();
};
exports.default = UrlHandler;
