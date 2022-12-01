const UrlHandler = (req, res, next) => {
  if (req.url.endsWith("/") && req.url.length > 1) {
    req.url = req.url.substr(0, req.url.length - 1);
  }
  next();
};

module.exports = UrlHandler;
