const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');

const utils = require('../lib/utils');

describe('Utils', () => {

  describe('`result()`', () => {
    test('if first argument is NOT a function returns its value', () => {
      expect(utils.result('a', 'string')).toBe('a');
    });

    test('if first argument is a function executes it passing any additional argument and returns its value', () => {
      const add = (a, b) => a + b;
      expect(utils.result(add, 1, 2)).toBe(3);
    });
  });




  describe('`createEndpoint()`', () => {

    test('by default returns a copy of the base response', () => {
      expect(utils.createEndpoint()).toEqual(utils.baseResponse);
    });

    test('extends base response', () => {
      const endpoint = utils.createEndpoint({ method: 'POST' });
      expect(endpoint.method).toBe('POST');
    });

    test('extends base response by retaining default properties', () => {
      const endpoint = utils.createEndpoint({ method: 'POST' });
      expect(endpoint.contentType).toBe(utils.baseResponse.contentType);
    });

    test('converts string paths to a regular expression', () => {
      const regexpTest = utils.createEndpoint({ path: '/users/:id' });
      expect(_.isRegExp(regexpTest.path)).toBe(true);
    });

    test('adds a `_keys` array property for string paths params parsing', () => {
      const regexpTest = utils.createEndpoint({ path: '/users/:id' });
      expect(regexpTest._keys).toEqual(expect.any(Array));
    });

    test('appends a base URL', () => {
      const baseUrlTest = utils.createEndpoint({ path: 'users/:id' }, { baseUrl: '/api/' });
      const expected = pathToRegexp('/api/users/:id').toString();
      expect(baseUrlTest.path.toString()).toBe(expected);
    });

    test('NOT Appending base URL when path begins with "/"', () => {
      const baseUrlSkipTest = utils.createEndpoint({ path: '/users/:id' }, { baseUrl: '/api/' });
      const expected = pathToRegexp('/users/:id').toString();
      expect(baseUrlSkipTest.path.toString()).toBe(expected);
    });
  });



  describe('`routeMatch()`', () => {

    let regExp;

    beforeEach(() => {
      regExp = new RegExp('test');
      regExp.exec = jest.fn(() => true);
    });

    test('fails when the match pattern is not a RegExp', () => {
      expect(utils.routeMatch('test', 'test')).toBe(false);
      expect(utils.routeMatch(null, 'test')).toBe(false);
    });

    test('matches regular expressions', () => {
      expect(utils.routeMatch(regExp, 'test')).toBe(true);
    });

    test('calls the .exec methods of the regexp', () => {
      utils.routeMatch(regExp, 'test')
      expect(regExp.exec).toHaveBeenCalled();
    });

    test('Matches regular expressions passing results', () => {
      expect(utils.routeMatch(/[a-z]/, 'test')).toHaveLength(1);
    });

    test('fails as expected with regular expressions too', () => {
      expect(utils.routeMatch(/^[a-z]+$/, 'te1st')).toBe(null);
    });

    test('fails when match target is not a string', () => {
      expect(utils.routeMatch('/test/', null)).toBe(false);
    });

  });

});



