const { result, delay } = require('./utils');

module.exports = (server) => async (ctx, next) => {
  const { data, endpoint } = server.resolve(ctx.req);

  if (endpoint) {
    const ms = result(endpoint.delay);

    ctx.type = endpoint.contentType;

    if (Number.isFinite(ms) && ms > 0) {
      await delay(ms);
    }

    ctx.body = data;
  }
  await next();
};