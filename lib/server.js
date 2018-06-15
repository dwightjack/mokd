const path = require('path');
const connect = require('connect'); //eslint-disable-line
const { argv } = require('yargs');
const { chance } = require('./utils');
const { middleware } = require('./index');

const { config, port = 8000 } = argv;

const endpoints = require(path.resolve(process.cwd(), config))(chance);

const app = connect();

app.use(middleware({
    baseUrl: '/api/',
    endpoints
}));

app.listen(port);

console.log(`Started a server on port ${port}`); // eslint-disable-line no-console