
describe('Server', () => {

  let Server;

  const textEndpoint = {
    path: '/api/v1/user',
    method: 'GET',
    response: {
        name: 'John',
        surname: 'Doe'
    }
  };

  beforeAll(() => {
    jest.mock('../lib/utils');
    Server = require('../lib/server').Server;

  });

  describe('`Server#getData`', () => {

    let server;
    let testParams;
    let fakeTransform;
    let fakeEmptyTransform;
    let utils;

    beforeEach(() => {
      utils = require('../lib/utils');

      fakeTransform = jest.fn(() => 'string');
      fakeEmptyTransform = jest.fn();

      utils.result.mockImplementation((v) => v);

      testParams = {
        $req: {
            method: 'GET'
        },
        $parsedUrl: {
            path: '/api/v1/user'
        }
      };

      server = new Server({
        transforms: [fakeTransform]
      });
    });

    test('Resolves the response data by calling "utils.result"', () => {
      server.getData(textEndpoint, testParams);
      expect(utils.result).toHaveBeenCalledWith(textEndpoint.response, testParams, textEndpoint);
    });

    test('transformer is called with computed data, the endpoint and the request params', () => {
      server.getData(textEndpoint, testParams);
      expect(fakeTransform).toHaveBeenCalledWith(textEndpoint.response, textEndpoint, testParams);
    });

    test('returns the result of the first non-undefined transform', () => {
      const output = server.getData(textEndpoint, testParams);
      const expected = fakeTransform();
      expect(output).toBe(expected);
    });

    test('when a transform returns a value, successive transforms are not called', () => {
      server.options.transforms.push(fakeEmptyTransform);
      server.getData(textEndpoint, testParams);
      expect(fakeEmptyTransform).toHaveBeenCalledTimes(0);
    });

    test('when a transform returns undefined executes the next one', () => {
      server.options.transforms = [fakeEmptyTransform, fakeTransform];
      server.getData(textEndpoint, testParams);
      expect(fakeEmptyTransform).toHaveBeenCalledTimes(1);
      expect(fakeTransform).toHaveBeenCalledTimes(1);
    });

  });

  describe('Server#setEndpoints()', () => {
    let server;
    let utils;
    let endpoints;

    beforeEach(() => {
      endpoints = [{
        path: '/api/test'
      }];
      utils = require('../lib/utils');
      utils.result.mockImplementation(() => endpoints);
      server = new Server({
        endpoints: null
      });
    });

    afterAll(() => {
      utils.result.mockImplementation((v) => v);
    })

    test('resolves endpoints', () => {
      const obj = {};
      server.setEndpoints(obj);
      expect(utils.result).toHaveBeenCalledWith(obj, server);
    });

    test('updates "options.endpoints" with the new endpoints', () => {
      const e = [];
      utils.result.mockImplementation(() => e);
      server.setEndpoints(e);
      expect(server.options.endpoints).toBe(e);
    });

    test('iterates "utils.createEndpoint" over endpoints', () => {
      server.setEndpoints(endpoints);
      expect(utils.createEndpoint).toHaveBeenCalledWith(endpoints[0], server.options)
    });

    test('assigns iterated array to "this.endpoints"', () => {
      expect(server.endpoints).toBeUndefined();
      utils.createEndpoint.mockImplementation(() => endpoints[0]);
      server.setEndpoints(endpoints);
      expect(server.endpoints).toHaveLength(1);
      expect(server.endpoints[0]).toBe(endpoints[0]);
    });

  });

  describe('Server#computeParams', () => {

    let server;
    let req;
    beforeEach(() => {
      req = {
        url: '/api/users'
      };
      server = new Server({
        endpoints: null
      });
    });

    test('parses request url with "url.parse"', () => {
      const url = require('url');
      jest.spyOn(url, 'parse');
      server.computeParams(req);
      expect(url.parse).toHaveBeenCalledWith(req.url, true);
      url.parse.mockRestore();
    });

    test('iterates over request interceptors', () => {
      const spy = jest.fn();
      server.options.interceptors = [spy];

      server.computeParams(req);
      expect(spy).toHaveBeenCalled();
    });

    test('uses "reduce" to iterate', () => {
      const int1 = () => ({ first: 1});
      const int2 = (v) => Object.assign(v, { second: 2 });
      const expected = { first: 1, second: 2 };

      server.options.interceptors = [int1, int2];

      const result = server.computeParams(req);
      expect(result).toEqual(expected);
    });

    test('returns a params object', () => {
      const result = server.computeParams(req);

      expect(result).toEqual({
        $req: req,
        $parsedUrl: require('url').parse(req.url, true),
        $routeMatch: null
      });
    });

  });

  describe('Server#getEndPoint', () => {

    const postReq = { method: 'POST' };
    const getReq = { method: 'GET' };
    const $parsedUrl = { pathname: '/api/products' };

    const params = (obj) => Object.assign({
      $parsedUrl: {
        path: '/api/v1/user'
      }
    }, obj);

    let server;
    let utils;

    beforeEach(() => {
      utils = require('../lib/utils');
      utils.result.mockImplementation((v) => v)
      utils.routeMatch.mockReturnValue(false)

      server = new Server();
      server.endpoints = [textEndpoint];
    });

    test('returns "undefined" if method do NOT match', () => {
      const p = params({ $req: postReq });
      expect(server.getEndPoint(p)).toBeUndefined();
    });

    test('tries to match the request path to endpoint\'s "path" property', () => {
      const p = params({ $req: getReq, $parsedUrl });

      utils.routeMatch.mockReturnValue(false)

      server.getEndPoint(p);

      expect(utils.result).toHaveBeenCalledWith(textEndpoint.path);
      expect(utils.routeMatch).toHaveBeenCalledWith(textEndpoint.path, $parsedUrl.pathname);
    });

    test('returns the matching endpoint on success', () => {
      const p = params({ $req: getReq, $parsedUrl });
      utils.routeMatch.mockReturnValue(true)
      expect(server.getEndPoint(p)).toBe(textEndpoint);
    });

    test('assigns the result of "routeMatch" to ".$routeMatch" param', () => {
      const ret = {};
      const p = params({ $req: getReq, $parsedUrl });
      utils.routeMatch.mockReturnValue(ret)
      server.getEndPoint(p);

      expect(p.$routeMatch).toBe(ret);

    });

    test('if endpoint has fragments ("_key") associates matches with them', () => {
      const expected = { id: 10, name: 'John' };
      const _keys = ['id', 'name'].map((name) => ({ name }))
      const p = params({ $req: getReq, $parsedUrl });
      server.endpoints = [Object.assign({ _keys }, textEndpoint )];
      utils.routeMatch.mockReturnValue([null, 10, 'John'])
      server.getEndPoint(p);
      expect(p.$routeMatch).toEqual(expected);

    });

  });

  describe('Server#resolve', () => {

    const params = {};

    let server;

    beforeEach(() => {
      server = new Server({
        endpoints: null
      });

      jest.spyOn(server, 'computeParams');
      jest.spyOn(server, 'getEndPoint');

      server.computeParams.mockReturnValue(params);

    });

    afterEach(() => {
      server.computeParams.mockRestore();
      server.getEndPoint.mockRestore();
    });

    test('combines Server#computeParams and Server#getEndPoint', () => {
      const req = {};
      server.getEndPoint.mockReturnValue(textEndpoint);

      server.resolve(req);

      expect(server.computeParams).toHaveBeenCalledWith(req);
      expect(server.getEndPoint).toHaveBeenCalledWith(params);

    });

    test('returns an empty object if none of the endpoints matches', () => {
      server.getEndPoint.mockReturnValue(undefined);
      const result = server.resolve({});
      expect(result).toEqual({});
    });

    test('on endpoint match, computes response data', () => {
      const spy = jest.spyOn(server, 'getData');
      server.getEndPoint.mockReturnValue(textEndpoint);

      server.resolve({});
      expect(spy).toHaveBeenCalledWith(textEndpoint, params);

      server.getData.mockRestore();
    });

    test('returns an object with response data and the endpoint configuration on match', () => {
      const expected = {};
      const spy = jest.spyOn(server, 'getData');
      spy.mockReturnValue(expected);
      server.getEndPoint.mockReturnValue(textEndpoint);

      const output = server.resolve({});
      expect(output).toEqual({ data: expected, endpoint : textEndpoint });

      server.getData.mockRestore();
    });

  });

});

/*
test('`Server#getEndPoint` basic', (assert) => {

    const options = {
        endpoints: [
            textEndpoint,
            dynamicResponseEnpoint
        ]
    };

    const _ = require('lodash');
    const utils = require('../lib/utils');

    const resultSpy = sinon.spy(utils, 'result');
    const routeMatchStub = sinon.stub(utils, 'routeMatch').returns([]);

    const { Server } = uncached('../lib/server');

    const inst = new Server(options);

    const testParams = {
        $req: {
            method: 'GET'
        },
        $parsedUrl: {
            pathname: '/api/v1/user'
        }
    };

    const params = _.clone(testParams);
    const endpoint = inst.getEndPoint(params);

    assert.ok(
        resultSpy.calledWithExactly(inst.endpoints[0].path),
        'Calls utils.result with endpoint path'
    );

    assert.ok(
        routeMatchStub.calledWithExactly(inst.endpoints[0].path, params.$parsedUrl.pathname),
        'Matches the endpoint path with the parsed URL path'
    );

    assert.equal(
        Array.isArray(params.$routeMatch),
        true,
        'Adds a `$routeMatch` param value with route matching result'
    );

    assert.deepEqual(
        endpoint,
        inst.endpoints[0],
        'Returns the matched endpoint'
    );


    //make it fail

    testParams.$req.method = 'POST';
    const endpointFail = inst.getEndPoint(_.clone(testParams));

    assert.equal(
        endpointFail,
        undefined,
        'Returns undefined on method match error'
    );

    testParams.$req.method = 'GET';
    routeMatchStub.returns(false);

    const endpointFail2 = inst.getEndPoint(_.clone(testParams));

    assert.equal(
        endpointFail2,
        undefined,
        'Returns undefined on route match fail'
    );

    utils.routeMatch.restore();
    utils.result.restore();

    assert.end();

});*/
/*
test('`Server#getEndPoint` parameters and regexps', (assert) => {

    const options = {
        endpoints: [
            paramEndpoint,
            regExpEndpoint
        ]
    };

    const _ = require('lodash');

    const { Server } = uncached('../lib/server');

    const inst = new Server(options);

    const testParams = {
        $req: {
            method: 'GET'
        },
        $parsedUrl: {
            pathname: '/api/v1/user'
        }
    };

    const params = _.clone(testParams);
    params.$parsedUrl.pathname = '/api/v1/user/10';
    inst.getEndPoint(params);

    assert.deepEqual(
        params.$routeMatch,
        { id: '10' },
        'With parameters URLs, populates $routeMatch with named params'
    );

    const params2 = _.clone(testParams);
    params2.$parsedUrl.pathname = '/api/v1/something';
    inst.getEndPoint(params2);

    assert.equal(
        Array.isArray(params2.$routeMatch),
        true,
        'With regexp returns an array'
    );

    assert.equal(
        params2.$routeMatch[1],
        'something',
        'With regexp returns the result of `RegExp.prototype.exec`'
    );

    assert.end();

});


test('`Server instance`', (assert) => {

    const _ = require('lodash');
    const options = {
        endpoints: [
            textEndpoint,
            dynamicResponseEnpoint
        ]
    };

    const utils = require('../lib/utils');
    const createEndpointSpy = sinon.spy(utils, 'createEndpoint');

    const { Server } = uncached('../lib/server');
    const inst = new Server(options);
    const expected = _.defaults(options, Server.defaults);

    assert.ok(
        inst instanceof Server,
        'Returns a Server instance'
    );

    assert.deepEqual(
        inst.options,
        expected,
        'Extends the passed-in options with defaults'
    );

    assert.ok(
        createEndpointSpy.calledTwice,
        'Called for every endpoint'
    );

    assert.deepEqual(
        createEndpointSpy.getCall(0).args[0],
        textEndpoint,
        'Calls `createEndpoint` with the passed-in endpoint'
    );

    assert.deepEqual(
        createEndpointSpy.getCall(0).args[1],
        inst.options,
        'Calls `createEndpoint` with options'
    );

    assert.ok(
        _.isPlainObject(inst.options),
        'Exposes an options object'
    );

    assert.ok(
        Array.isArray(inst.endpoints),
        'Exposes an array of endpoints'
    );

    assert.ok(
        _.isFunction(inst.use),
        'Exposes a function to be used as connect / express middleware'
    );

    utils.createEndpoint.restore();
    assert.end();

});

*/
/*
test('`middleware basic usage`', (assert) => {

    const options = {
        endpoints: [
            textEndpoint
        ]
    };

    const { Server } = uncached('../lib/server');

    const inst = new Server(options);

    const createEndpoint = require('../lib/utils').createEndpoint;
    const { baseResponse } = require('../lib/utils');

    const res = createRes();
    const next = sinon.spy();

    const expectedData = JSON.stringify({
        key: 'value'
    });
    //always match
    sinon.stub(inst, 'getEndPoint').returns(createEndpoint(textEndpoint));
    sinon.stub(Server, 'parseData').returns(expectedData);

    inst.use({
        url: ''
    }, res, next);

    assert.equal(
        next.callCount,
        0,
        'route is matched don\'t fall to next middleware'
    );

    assert.deepEqual(
        res.setHeader.getCall(0).args,
        ['Content-Type', baseResponse.contentType],
        'Sets response content-type'
    );

    assert.equal(
        res.end.getCall(0).args[0],
        expectedData,
        'Calls response end with parsed data'
    );

    Server.parseData.restore();

    assert.end();

});
*/
/*
test('`allows array as JSON results`', (assert) => {

    const users = [{
        name: 'John'
    }, {
        name: 'Jane'
    }];

    const options = {
        endpoints: [
            {
                path: '/api/v1/users',
                response: users
            }
        ]
    };

    const { Server } = uncached('../lib/server');
    const inst = new Server(options);

    const res = createRes();
    const next = sinon.spy();

    const expected = JSON.stringify(users);

    inst.use({
        url: '/api/v1/users',
        method: 'GET'
    }, res, next);


    assert.equal(
        res.end.getCall(0).args[0],
        expected,
        'Returns a stringified array'
    );

    assert.end();
});*/