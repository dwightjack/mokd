const url = require('url');

const _ = require('lodash');
const utils = require('./utils');

function Middleware(options) {
    this.opts = _.defaults(options || {}, Middleware.defaults);

    this.endpoints = this.opts.endpoints.map((endpoint) => utils.createEndpoint(endpoint));

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
        const match = utils.routeMatch(routePath, params.$parsedUrl.path);

        if (params.$req.method === endpoint.method && match) {
            params.$routeMatch = match; // eslint-disable-line no-param-reassign
            return true;
        }
        return false;

    });
};

Middleware.parseData = function parseData(endpoint, params) {
    const data = utils.result(endpoint.template, params, endpoint);

    if (endpoint.contentType === 'application/json') {
        if (_.isPlainObject(data)) {
            return JSON.stringify(
                _.mapValues(data, (val) => utils.result(val, params, endpoint)),
                null,
                2
            );
        }
        return JSON.stringify(data, null, 2);

    }
    return data.toString();
};

Middleware.defaults = {
    endpoints: []
};

module.exports.Middleware = Middleware;

module.exports.middleware = (options) => new Middleware(options).use;