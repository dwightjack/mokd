const test = require('tape-async');
const sinon = require('sinon');
const uncached = require('require-uncached');
const createRes = () => ({
    end: sinon.spy(),
    setHeader: sinon.spy()
});

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

test('`Server#getData`', (assert) => {
  const utils = require('../lib/utils');

  const resultSpy = sinon.stub(utils, 'result');
  const fakeTransform = sinon.stub();
  const fakeEmptyTransform = sinon.stub();
  const data = {};
  const expected = {};
  const testParams = {
    $req: {
        method: 'GET'
    },
    $parsedUrl: {
        path: '/api/v1/user'
    }
  };

  resultSpy.returns(data);
  fakeTransform.returns(expected)
  fakeEmptyTransform.returns(undefined);

  const { Server } = uncached('../lib/server');
  const inst = new Server({
    transforms: [fakeTransform]
  });

  const output = inst.getData(textEndpoint, testParams);

  assert.deepEqual(
    resultSpy.getCall(0).args,
    [textEndpoint.response, testParams, textEndpoint],
    'Resolves the response data `utils.result`'
  );

  assert.ok(
    fakeTransform.calledWithExactly(data, textEndpoint, testParams),
    'transformer is called with computed data, the endpoint and the request params'
  );

  assert.equal(
    output,
    expected,
    'Returns the result of the first non-undefined transform'
  );

  inst.options.transforms.push(fakeEmptyTransform);
  inst.getData(textEndpoint, testParams);

  assert.equal(
    fakeEmptyTransform.callCount,
    0,
    'When a transform returns a value, successive transforms are not called'
  );

  fakeEmptyTransform.resetHistory();
  fakeTransform.resetHistory();

  inst.options.transforms = [fakeEmptyTransform, fakeTransform];
  inst.getData(textEndpoint, testParams);

  assert.equal(
    fakeEmptyTransform.callCount + fakeTransform.callCount,
    2,
    'When a transform returns undefined executes the next one'
  );

  utils.result.restore();
  assert.end();

});

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

});

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

    utils.createEndpoint.restore();
    assert.end();

});


