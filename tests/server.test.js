const textEndpoint = {
  path: '/api/v1/user',
  response: {
      name: 'John',
      surname: 'Doe'
  }
};

const paramEndpoint = {
  path: '/api/v1/user/:id',
  response: {
      name: 'John',
      surname: 'Doe'
  }
};

const regExpEndpoint = {
  path: /\/api\/v1\/(.+)/,
  response: {
      name: 'John',
      surname: 'Doe'
  }
};

const dynamicResponseEnpoint = {
  path: () => '/api/v1/dyn-user',
  response: {
      name: () => 'John',
      surname: () => 'Doe'
  }
};

describe('Server', () => {

  jest.mock('../lib/utils');
  let Server;
  let utils;

  beforeAll(() => {
    Server = require('../lib/server').Server;
    utils = require('../lib/utils');

  });

  describe('`Server#getData`', () => {

    let server;
    let testParams;
    let fakeTransform;
    let fakeEmptyTransform;

    beforeEach(() => {

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

});

/*
test('`Server#getData`', (assert) => {

    const _ = require('lodash');
    const utils = require('../lib/utils');

    const resultSpy = sinon.spy(utils, 'result');
    const stringifySpy = sinon.spy(JSON, 'stringify');

    const { Server } = uncached('../lib/server');

    const testParams = {
        $req: {
            method: 'GET'
        },
        $parsedUrl: {
            path: '/api/v1/user'
        }
    };

    const testEndpoint = Object.assign({
        contentType: 'application/json'
    }, textEndpoint);

    const params = _.clone(testParams);
    const data = Server.parseData(testEndpoint, params);

    assert.ok(
        typeof data === 'string',
        'Returns a string'
    );

    assert.deepEqual(
        resultSpy.getCall(0).args,
        [testEndpoint.response, params, testEndpoint],
        'Resolves the response with `utils.result`'
    );

    assert.ok(
        resultSpy.getCall(0).returned(sinon.match.object),
        'Returns an object whenever the response is an object'
    );

    assert.equal(
        Object.keys(textEndpoint.response).length,
        resultSpy.callCount - 1,
        'Calls `utils.result` on every key of the response'
    );

    assert.equal(
        stringifySpy.callCount,
        1,
        'Expects a stringify-ed JSON to be returned'
    );


    //special cases test

    stringifySpy.resetHistory();
    resultSpy.resetHistory();

    //response type is not JSON

    testEndpoint.contentType = 'text/html';
    Server.parseData(testEndpoint, params);

    assert.ok(
        stringifySpy.callCount === 0 && resultSpy.callCount === 1,
        'Not parsing and stringify-ing data when endpoint contentType is not `application/json`'
    );

    JSON.stringify.restore();
    utils.result.restore();

    assert.end();

});

*/
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