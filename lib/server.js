const path = require('path');
const connect = require('connect');
const argv = require('yargs').argv;
const chance = require('./utils').chance;
const middleware = require('./index').middleware;

const endpoints = require(path.resolve(process.cwd(), argv.config))(chance);

const app = connect();
const port = argv.port || 8000;

app.use(middleware({
    endpoints
}));

app.listen(port);

console.log(`Started a server on port ${port}`); // eslint-disable-line no-console