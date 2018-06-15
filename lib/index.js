const url = require('url');

const isPlainObject = require('lodash/isPlainObject');
const has = require('lodash/has');
const { result, createEndpoint, delay, routeMatch } = require('./utils');

class Middleware {

  static parseData(endpoint, params) {
    const data = result(endpoint.template, params, endpoint);

    if (endpoint.contentType === 'application/json') {
      if (isPlainObject(data)) {
        return JSON.stringify(
          Object.values(data).map((val) => result(val, params, endpoint))
        );
      }
      return JSON.stringify(data);

    }
    return data.toString();
  }

  constructor(options = {}) {
    const opts = this.options = Object.assign({}, Middleware.defaults, options);

    this.endpoints = opts.endpoints.map((endpoint) => createEndpoint(endpoint, opts));

    this.use = async (req, res, next) => {
      const params = {
        $req: req,
        $parsedUrl: url.parse(req.url, true),
        $routeMatch: null
      };

      const endpoint = this.getEndPoint(params);

      if (!endpoint) {
        next();
        return;
      }

      const data = Middleware.parseData(endpoint, params);

      res.setHeader('Content-Type', endpoint.contentType);

      const ms = result(endpoint.delay);

      if (Number.isFinite(ms) && ms > 0) {
        await delay(ms);
      }

      res.end(data);
    }
    return this;
  }

  getEndPoint(params = {}) {
    const { $req, $parsedUrl } = params;

    return this.endpoints.find(({ method, path, _keys }) => {
      const match = routeMatch(result(path), $parsedUrl.pathname);

      if ($req.method === method && match) {

        if (!Array.isArray(_keys) || _keys.length === 0) {
          params.$routeMatch = match;
          return true;
        }

        params.$routeMatch = match.slice(1).reduce((acc, val, i) => {
          const { name } = _keys[i] || {};
          if (name && val !== undefined || !has(acc, name)) {
            acc[name] = val;
          }
          return acc;
        }, {});

        return true;
      }
      return false;

    });
  }
}

Middleware.defaults = {
  endpoints: [],
  baseUrl: ''
};

module.exports = {
  Middleware,
  middleware : (options) => new Middleware(options).use
};