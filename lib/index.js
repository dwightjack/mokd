const url = require('url');

const defaults = require('lodash/defaults');
const isPlainObject = require('lodash/isPlainObject');
const mapValues = require('lodash/mapValues');
const has = require('lodash/has');
const utils = require('./utils');

function Middleware(options) {
    const opts = this.opts = defaults(options || {}, Middleware.defaults); //eslint-disable-line no-multi-assign

    this.endpoints = opts.endpoints.map((endpoint) => utils.createEndpoint(endpoint, opts));

    this.use = (req, res, next) => {
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

        const delay = utils.result(endpoint.delay);
        if (Number.isFinite(delay) && delay > 0) {
            setTimeout(() => res.end(data), delay);
        } else {

            res.end(data);
        }

    };

    return this;

}

Middleware.prototype.getEndPoint = function getEndPoint(params) {
    return this.endpoints.find((endpoint) => {
        const routePath = utils.result(endpoint.path);
        const match = utils.routeMatch(routePath, params.$parsedUrl.pathname);

        if (params.$req.method === endpoint.method && match) {
            const keys = endpoint._keys; //eslint-disable-line no-underscore-dangle
            const p = {};


            if (!Array.isArray(keys) || keys.length === 0) {
                params.$routeMatch = match; // eslint-disable-line no-param-reassign
                return true;
            }

            for (let i = 1; i < match.length; i += 1) {
                const key = keys[i - 1];
                const prop = key.name;
                const val = match[i];

                if (val !== undefined || !has(p, prop)) {
                    p[prop] = val;
                }
            }

            params.$routeMatch = p; // eslint-disable-line no-param-reassign
            return true;
        }
        return false;

    });
};

Middleware.parseData = function parseData(endpoint, params) {
    const data = utils.result(endpoint.template, params, endpoint);

    if (endpoint.contentType === 'application/json') {
        if (isPlainObject(data)) {
            return JSON.stringify(
                mapValues(data, (val) => utils.result(val, params, endpoint)),
                null,
                2
            );
        }
        return JSON.stringify(data, null, 2);

    }
    return data.toString();
};

Middleware.defaults = {
    endpoints: [],
    baseUrl: ''
};

module.exports.Middleware = Middleware;

module.exports.middleware = (options) => new Middleware(options).use;