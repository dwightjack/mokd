const { Server } = require('./lib/server');
const connect = require('./lib/connect');

module.exports = {
  Server,
  connectMock: (options) => connect(new Server(options))
}