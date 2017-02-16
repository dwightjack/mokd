const fs = require('fs');

const isFunction = require('lodash/isFunction');
const defaults = require('lodash/defaults');
const isRegExp = require('lodash/isRegExp');
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

const result = (fn, params, endpoint) => (isFunction(fn) ? fn(params, endpoint) : fn);

module.exports.result = result;


module.exports.createEndpoint = (endpoint, opts = { baseUrl: '' }) => {
    const ep = defaults(endpoint || {}, baseTemplate);
    if (typeof ep.path === 'string') {
        const path = ep.path.indexOf('/') === 0 ? ep.path : opts.baseUrl + ep.path;
        ep._keys = []; //eslint-disable-line no-underscore-dangle
        ep.path = pathToRegexp(path, ep._keys); //eslint-disable-line no-underscore-dangle
    }
    return ep;
};


module.exports.routeMatch = (route, match) => (isRegExp(route) ? route.exec(match) : false);

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