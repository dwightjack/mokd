const { result, delay } = require('./utils');

module.exports = (server) => async (req, res, next) => {
  const { data, endpoint } = server.resolve(req);

  if (!endpoint) {
    next();
    return;
  }

  res.setHeader('Content-Type', endpoint.contentType);

  const ms = result(endpoint.delay);

  if (Number.isFinite(ms) && ms > 0) {
    await delay(ms);
  }

  res.end(data);
};