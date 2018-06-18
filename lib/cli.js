const path = require('path');
const connect = require('connect'); //eslint-disable-line
const Koa = require('koa'); //eslint-disable-line
const { argv } = require('yargs');
const { connectServer, koaServer } = require('../index');

const { config, port = 8000, framework = 'connect' } = argv;

const endpoints = require(path.resolve(process.cwd(), config))();

if (framework === 'connect') {
  const app = connect();
  app.use(connectServer({
    baseUrl: '/api/',
    endpoints
  }));
  app.listen(port, () => {
    console.log(`Started a connect server at http://localhost:${port}`); // eslint-disable-line no-console
  });

} else if (framework === 'koa') {
  const app = new Koa();
  app.use(koaServer({
    baseUrl: '/api/',
    endpoints
  }));
  app.listen(port, () => {
    console.log(`Started a Koa server at http://localhost:${port}`); // eslint-disable-line no-console
  });
}
