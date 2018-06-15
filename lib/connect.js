const url = require('url');
const { result, delay } = require('./utils');

module.exports = (server) => async (req, res, next) => {
  const params = {
    $req: req,
    $parsedUrl: url.parse(req.url, true),
    $routeMatch: null
  };

  const endpoint = server.getEndPoint(params);

  if (!endpoint) {
    next();
    return;
  }

  const data = server.getData(endpoint, params);

  res.setHeader('Content-Type', endpoint.contentType);

  const ms = result(endpoint.delay);

  if (Number.isFinite(ms) && ms > 0) {
    await delay(ms);
  }

  res.end(data);
};