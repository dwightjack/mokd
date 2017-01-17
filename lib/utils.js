const fs = require('fs');

const _ = require('lodash');
const Chance = require('chance');
const pathToRegexp = require('path-to-regexp');

const baseTemplate = {
    method: 'GET',
    path: null,
    delay: 0,
    contentType: 'application/json',
    template: null
};

module.exports.baseTemplate = baseTemplate;

const result = (fn, params, endpoint) => (_.isFunction(fn) ? fn(params, endpoint) : fn);

module.exports.result = result;


module.exports.createEndpoint = (endpoint) => {
    const ep = _.defaults(endpoint || {}, baseTemplate);
    if (typeof ep.path === 'string') {
        ep._keys = []; //eslint-disable-line no-underscore-dangle
        ep.path = pathToRegexp(ep.path, ep._keys); //eslint-disable-line no-underscore-dangle
    }
    return ep;
};


module.exports.routeMatch = (route, match) => (_.isRegExp(route) ? route.exec(match) : false);

module.exports.chance = new Chance();


const readFile = (filepath) => {
    if (filepath && fs.existsSync(filepath)) {
        return fs.readFileSync(filepath, 'utf8');
    }
    return false;
};
module.exports.readFile = readFile;

module.exports.readJSON = (filepath) => {
    const content = readFile(filepath);
    return content ? JSON.parse(content) : false;
};