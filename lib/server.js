const url = require('url');
const has = require('lodash/has');
const { result, createEndpoint, routeMatch, transformJSON, transformText } = require('./utils');

class Server {

  constructor(options = {}) {
    const opts = this.options = Object.assign({}, Server.defaults, options);

    this.endpoints = opts.endpoints.map((endpoint) => createEndpoint(endpoint, opts));

    return this;
  }

  getData(endpoint, params) {
    const data = result(endpoint.response, params, endpoint);
    const { transforms } = this.options;
    let output;
    for (let i = 0; i < transforms.length; i += 1) {
      output = transforms[i](data, endpoint, params);
      if (output !== undefined) {
        return output;
      }
    }
  }

  computeParams(req) {
    const { interceptors } = this.options;
    const params = {
      $req: req,
      $parsedUrl: url.parse(req.url, true),
      $routeMatch: null
    }
    if (Array.isArray(interceptors) && interceptors.length > 0) {
      return interceptors.reduce((v, fn) => fn(v), params);
    }
    return params;
  }

  resolve(req) {
    const params = this.computeParams(req);
    const endpoint = this.getEndPoint(params);
    if (!endpoint) {
      return {};
    }
    return {
      data: this.getData(endpoint, params),
      endpoint
    };
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

Server.defaults = {
  endpoints: [],
  baseUrl: '',
  transforms: [
    transformJSON,
    transformText
  ],
  interceptors: []
};

module.exports = {
  Server
};