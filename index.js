const { Server } = require('./lib/server');
const connect = require('./lib/connect');
const koa = require('./lib/koa');
const { createWatcher } = require('./lib/watcher');
const { transformJSON, transformText } = require('./lib/utils');

const applyMiddleware = (middleware) => (arg) => {
  const srv = arg instanceof Server ? arg : new Server(arg);
  return middleware(srv);
};

module.exports = {
  Server,
  transformJSON,
  transformText,
  createWatcher,
  applyMiddleware,
  koaServer: applyMiddleware(koa),
  connectServer: applyMiddleware(connect)
}