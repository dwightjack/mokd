const path = require('path');
const connect = require('connect'); //eslint-disable-line
const Koa = require('koa'); //eslint-disable-line
const { argv } = require('yargs');
const { connectServer, koaServer, createWatcher, Server } = require('../index');
const { config, port = 8000, framework = 'connect', watch = false } = argv;


const server = new Server();

if (watch) {
  createWatcher({
    entrypoint: config,
    paths: ['./fixtures/*.*'],
    server,
  });

} else {
const endpoints = require(path.resolve(process.cwd(), config))();
  server.setEndpoints(endpoints);
}

if (framework === 'connect') {
  const app = connect();
  app.use(connectServer(server));
  app.listen(port, () => {
    console.log(`Started a connect server at http://localhost:${port}`); // eslint-disable-line no-console
  });

} else if (framework === 'koa') {
  const app = new Koa();
  app.use(koaServer(server));
  app.listen(port, () => {
    console.log(`Started a Koa server at http://localhost:${port}`); // eslint-disable-line no-console
  });
}
