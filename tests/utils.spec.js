const test = require('tape');
const sinon = require('sinon');
const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');

const utils = require('../lib/utils');

test('`.result()`', (assert) => {

    assert.equal(
        utils.result('test'),
        'test',
        'If a string, just returns it'
    );

    assert.equal(
        utils.result((params, endpoint) => params + endpoint, 'test', 'string'),
        'teststring',
        'If a functions executes it with following parameters'
    );

    assert.end();

});


test('`.createEndpoint()`', (assert) => {


    assert.deepEqual(
        utils.createEndpoint(),
        utils.baseResponse,
        'By default returns a copy of the base response'
    );

    const endpoint = utils.createEndpoint({ method: 'POST' });

    assert.equal(
        endpoint.method,
        'POST',
        'Extends base response'
    );

    assert.equal(
        endpoint.contentType,
        utils.baseResponse.contentType,
        'Extends base response by retaining default properties'
    );

    const regexpTest = utils.createEndpoint({ path: '/users/:id' });

    assert.equal(
        _.isRegExp(regexpTest.path),
        true,
        'Converts string paths to a regular Expression'
    );

    assert.equal(
        Array.isArray(regexpTest._keys), //eslint-disable-line
        true,
        'Adds a `_keys` array property for string paths params parsing'
    );

    const baseUrlTest = utils.createEndpoint({ path: 'users/:id' }, { baseUrl: '/api/' });

    assert.equal(
        baseUrlTest.path.toString(),
        pathToRegexp('/api/users/:id').toString(),
        'Appends a base URL'
    );

    const baseUrlSkipTest = utils.createEndpoint({ path: '/users/:id' }, { baseUrl: '/api/' });

    assert.equal(
        baseUrlSkipTest.path.toString(),
        pathToRegexp('/users/:id').toString(),
        'NOT Appending base URL when path begins with `/`'
    );

    assert.end();


});


test('`.routeMatch()`', (assert) => {

    const regExp = new RegExp('test');
    const regExpSpy = sinon.stub(regExp, 'exec').returns(true);


    assert.equal(
        utils.routeMatch('test', 'test'),
        false,
        'Fails when the match pattern is not a RegExp'
    );

    assert.equal(
        utils.routeMatch(null, 'test'),
        false,
        'Fails (again) when the match pattern is not a RegExp'
    );

    assert.equal(
        utils.routeMatch(regExp, 'test'),
        true,
        'Matches regular expressions'
    );

    assert.equal(
        regExpSpy.calledWith('test'),
        true,
        'Calls the .exec methods of the regexp'
    );

    assert.equal(
        utils.routeMatch(/[a-z]/, 'test').length,
        1,
        'Matches regular expressions passing results'
    );

    assert.equal(
        utils.routeMatch(/^[a-z]+$/, 'te1st'),
        null,
        'Fails as expected with regular expressions too'
    );

    assert.equal(
        utils.routeMatch('/test/', null),
        false,
        'Fails when match target is not a string'
    );

    assert.end();

});