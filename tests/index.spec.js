const test = require('tape-async');
const sinon = require('sinon');
const uncached = require('require-uncached');
const createRes = () => ({
    end: sinon.spy(),
    setHeader: sinon.spy()
});

const textEndpoint = {
    path: '/api/v1/user',
    template: {
        name: 'John',
        surname: 'Doe'
    }
};

const paramEndpoint = {
    path: '/api/v1/user/:id',
    template: {
        name: 'John',
        surname: 'Doe'
    }
};

const regExpEndpoint = {
    path: /\/api\/v1\/(.+)/,
    template: {
        name: 'John',
        surname: 'Doe'
    }
};

const textEndpointDelay = {
    path: '/api/v1/user',
    template: {
        name: 'John',
        surname: 'Doe'
    },
    delay: 1000
};


const dynamicTemplateEnpoint = {
    path: () => '/api/v1/dyn-user',
    template: {
        name: () => 'John',
        surname: () => 'Doe'
    }
};



test('`Middleware.parseData`', (assert) => {

    const _ = require('lodash');
    const utils = require('../lib/utils');

    const resultSpy = sinon.spy(utils, 'result');
    const stringifySpy = sinon.spy(JSON, 'stringify');

    const { Middleware } = uncached('../lib/index');

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
    const data = Middleware.parseData(testEndpoint, params);

    assert.ok(
        typeof data === 'string',
        'Returns a string'
    );

    assert.deepEqual(
        resultSpy.getCall(0).args,
        [testEndpoint.template, params, testEndpoint],
        'Resolves the template with `utils.result`'
    );

    assert.ok(
        resultSpy.getCall(0).returned(sinon.match.object),
        'Returns an object whenever the template is an object'
    );

    assert.equal(
        Object.keys(textEndpoint.template).length,
        resultSpy.callCount - 1,
        'Calls `utils.result` on every key of the template'
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
    Middleware.parseData(testEndpoint, params);

    assert.ok(
        stringifySpy.callCount === 0 && resultSpy.callCount === 1,
        'Not parsing and stringify-ing data when endpoint contentType is not `application/json`'
    );

    JSON.stringify.restore();
    utils.result.restore();

    assert.end();

});



test('`Middleware#getEndPoint` basic', (assert) => {

    const options = {
        endpoints: [
            textEndpoint,
            dynamicTemplateEnpoint
        ]
    };

    const _ = require('lodash');
    const utils = require('../lib/utils');

    const resultSpy = sinon.spy(utils, 'result');
    const routeMatchStub = sinon.stub(utils, 'routeMatch').returns([]);

    const { Middleware } = uncached('../lib/index');

    const inst = new Middleware(options);

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

test('`Middleware#getEndPoint` parameters and regexps', (assert) => {

    const options = {
        endpoints: [
            paramEndpoint,
            regExpEndpoint
        ]
    };

    const _ = require('lodash');

    const { Middleware } = uncached('../lib/index');

    const inst = new Middleware(options);

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


test('`Middleware instance`', (assert) => {

    const _ = require('lodash');
    const options = {
        endpoints: [
            textEndpoint,
            dynamicTemplateEnpoint
        ]
    };

    const utils = require('../lib/utils');
    const createEndpointSpy = sinon.spy(utils, 'createEndpoint');

    const { Middleware } = uncached('../lib/index');
    const inst = new Middleware(options);
    const expected = _.defaults(options, Middleware.defaults);

    assert.ok(
        inst instanceof Middleware,
        'Returns a Middleware instance'
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


test('`middleware basic usage`', (assert) => {

    const options = {
        endpoints: [
            textEndpoint
        ]
    };

    const { Middleware } = uncached('../lib/index');

    const inst = new Middleware(options);

    const createEndpoint = require('../lib/utils').createEndpoint;
    const baseTemplate = require('../lib/utils').baseTemplate;

    const res = createRes();
    const next = sinon.spy();

    const expectedData = JSON.stringify({
        key: 'value'
    });
    //always match
    sinon.stub(inst, 'getEndPoint').returns(createEndpoint(textEndpoint));
    sinon.stub(Middleware, 'parseData').returns(expectedData);

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
        ['Content-Type', baseTemplate.contentType],
        'Sets response content-type'
    );

    assert.equal(
        res.end.getCall(0).args[0],
        expectedData,
        'Calls response end with parsed data'
    );

    Middleware.parseData.restore();

    assert.end();

});

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
                template: users
            }
        ]
    };

    const { Middleware } = uncached('../lib/index');
    const inst = new Middleware(options);

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
});



test('`middleware not matching fallback`', async (assert) => {

    const options = {
        endpoints: [
            textEndpoint
        ]
    };

    const { Middleware } = uncached('../lib/index');
    const inst = new Middleware(options);

    const res = createRes();
    const next = sinon.spy();

    //never match
    sinon.stub(inst, 'getEndPoint').returns(undefined);

    await inst.use({
        url: ''
    }, res, next);

    assert.equal(
        next.callCount,
        1,
        'fallback to next middleware when no endpoint matches'
    );

    assert.equals(
        res.end.callCount,
        0,
        'Doesn\'t output anything'
    );

    assert.end();

});


test('`middleware delayed results`', (assert) => {

    const createEndpoint = require('../lib/utils').createEndpoint;

    const options = {
        endpoints: [
            textEndpointDelay
        ]
    };

    const { Middleware } = uncached('../lib/index');
    const inst = new Middleware(options);

    const res = createRes();
    const next = sinon.spy();

    sinon.stub(inst, 'getEndPoint').returns(createEndpoint(textEndpointDelay));
    const clock = sinon.useFakeTimers();

    inst.use({
        url: ''
    }, res, next).then(() => {
      assert.equal(
          res.end.callCount,
          1,
          'Called after the delay period'
      );

      clock.restore();

      assert.end();
    });

    assert.equal(
        res.end.callCount,
        0,
        'Not called right away'
    );

    clock.tick(textEndpointDelay.delay);



});


test('middleware utility function', (assert) => {

    const middleware = require('../lib/index').middleware;

    const options = {
        endpoints: [
            textEndpointDelay
        ]
    };

    const use = middleware(options);

    assert.ok(
        typeof use === 'function',
        'Returns a middleware function'
    );

    assert.end();

});