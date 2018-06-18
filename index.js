const { Server } = require('./lib/server');
const connect = require('./lib/connect');
const koa = require('./lib/koa');
const { transformJSON, transformText } = require('./lib/utils');

const applyMiddleware = (middleware) => (options) => middleware(new Server(options));

module.exports = {
  Server,
  transformJSON,
  transformText,
  applyMiddleware,
  koaServer: applyMiddleware(koa),
  connectServer: applyMiddleware(connect)
}