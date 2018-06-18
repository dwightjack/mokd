const { Server } = require('./lib/server');
const connect = require('./lib/connect');
const { transformJSON, transformText } = require('./lib/utils');

module.exports = {
  Server,
  transformJSON,
  transformText,
  connectServer: (options) => connect(new Server(options))
}