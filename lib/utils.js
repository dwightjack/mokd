const path = require('path');
const isPlainObject = require('lodash/isPlainObject');
const isFunction = require('lodash/isFunction');
const mapValues = require('lodash/mapValues');
const isRegExp = require('lodash/isRegExp');
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

const delay = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const transformText = (data) => data.toString();

const transformJSON = (stringify = JSON.stringify) => (data, endpoint, params) => {
  if (endpoint.contentType === 'application/json') {
    if (isPlainObject(data)) {
      return stringify(
        mapValues(data, (val) => result(val, params, endpoint))
      );
    }
    return stringify(data);
  }
};

const resolveFiles = (obj, cwd = '') => Object.entries(obj).reduce((f, [folder, filenames]) => {
  const basePath = path.join(cwd, folder);
  f.push(...filenames.map((f) => path.join(basePath, f)));
  return f;
}, []);

const uncacheModules = (files, log = false) => {
  files.forEach((f) => {
    log && console.info(`Unloading ${f}`);
    if (require.cache[f]) {
      delete require.cache[f];
    }
  });
};

module.exports = {
  baseResponse,
  result,
  createEndpoint,
  routeMatch,
  delay,
  transformJSON,
  transformText,
  resolveFiles,
  uncacheModules
};


