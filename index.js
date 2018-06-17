const { Server } = require('./lib/server');
const connect = require('./lib/connect');

module.exports = {
  Server,
  asConnect: (options) => connect(new Server(options))
}