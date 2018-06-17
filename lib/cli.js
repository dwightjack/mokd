const path = require('path');
const connect = require('connect'); //eslint-disable-line
const { argv } = require('yargs');
const { asConnect } = require('../index');

const { config, port = 8000 } = argv;

const endpoints = require(path.resolve(process.cwd(), config))();

const app = connect();

app.use(asConnect({
    baseUrl: '/api/',
    endpoints
}));

app.listen(port, () => {
  console.log(`Started a server at http://localhost:${port}`); // eslint-disable-line no-console
});
