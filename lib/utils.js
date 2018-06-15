const isFunction = require('lodash/isFunction');
const isRegExp = require('lodash/isRegExp');
const Chance = require('chance');
const pathToRegexp = require('path-to-regexp');

const baseResponse = {
    method: 'GET',
    path: null,
    delay: 0,
    contentType: 'application/json',
    response: null
};

const result = (fn, ...args) => (isFunction(fn) ? fn(...args) : fn);

const createEndpoint = (endpoint = {}, { baseUrl = '' } = {}) => {
    const ep = Object.assign({}, baseResponse, endpoint);
    if (typeof ep.path === 'string') {
        const path = ep.path.startsWith('/') ? ep.path : `${baseUrl}${ep.path}`;
        ep._keys = [];
        ep.path = pathToRegexp(path, ep._keys);
    }
    return ep;
};

const routeMatch = (route, match) => (isRegExp(route) && route.exec(match));

const chance = new Chance();

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

module.exports = {
  baseResponse,
  result,
  createEndpoint,
  routeMatch,
  chance,
  delay
};


