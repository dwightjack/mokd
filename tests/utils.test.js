const _ = require('lodash');
const pathToRegexp = require('path-to-regexp');

const utils = require('../lib/utils');

describe('Utils', () => {

  describe('result()', () => {
    test('if first argument is NOT a function returns its value', () => {
      expect(utils.result('a', 'string')).toBe('a');
    });

    test('if first argument is a function executes it passing any additional argument and returns its value', () => {
      const add = (a, b) => a + b;
      expect(utils.result(add, 1, 2)).toBe(3);
    });
  });




  describe('createEndpoint()', () => {

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



  describe('routeMatch()', () => {

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

  describe('delay()', () => {

    test('returns a Promise', () => {
      expect(utils.delay()).toEqual(expect.any(Promise));
    });

    test('resolve the promise after a given amout of ms', async () => {
      expect.assertions(2);
      const spy = jest.fn();
      jest.useFakeTimers();
      const promise = utils.delay().then(spy);
      expect(spy).not.toHaveBeenCalled();
      jest.runAllTimers();
      await promise;
      expect(spy).toHaveBeenCalled();
    })

  });

  describe('transformText()', () => {
    let spy

    beforeEach(() => {
      spy = {
        toString: jest.fn(() => 'string')
      };
    });

    test('calls ".toString" method of passed in object', () => {
      utils.transformText(spy);
      expect(spy.toString).toHaveBeenCalled();
    });

    test('returns the result of the ".toString" method', () => {
      const value = utils.transformText(spy);
      expect(value).toBe('string');
    });
  });

  describe('transformJSON()', () => {

    const endpoint = {
      contentType: 'application/json'
    };

    test('returns "undefined" when matched endpoint contentType is NOT "application/json"', () => {
      const result = utils.transformJSON({}, { contentType: 'text/html' });
      expect(result).toBeUndefined()
    });

    test('JSON.stringify data and return', () => {
      const data = {
        name: 'John'
      };

      const array = [{
        name: 'John'
      }]
      const result = utils.transformJSON(data, endpoint);
      expect(result).toBe(JSON.stringify(data));

      const resultArray = utils.transformJSON(array, endpoint);
      expect(resultArray).toBe(JSON.stringify(array));
    });

    test('if "data" is an object iterate on keys and try to execute its values', () => {
      const data = {
        name: 'John',
        surname: () => 'Doe'
      };
      const result = utils.transformJSON(data, endpoint);
      const expected = JSON.stringify({ name: 'John', surname: 'Doe' });
      expect(result).toBe(expected);
    });

    test('iterator passes "params" and "endpoint" to each value', () => {
      const spy = jest.fn();
      const data = {
        name: spy,
        surname: spy
      };
      const params = {};
      utils.transformJSON(data, endpoint, params);

      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenCalledWith(params, endpoint);
    });

  });

  describe('resolveFiles()', () => {
    let dict;

    beforeEach(() => {
      dict = {
        '/demo': ['first.js', 'second.js']
      };
    });

    test('resolves a dictionary of type: "folder: [...files]" to an array of paths', () => {
      const expected = [
        '/demo/first.js',
        '/demo/second.js'
      ];
      expect(utils.resolveFiles(dict)).toEqual(expected);
    });

    test('accepts a common base folder as second option', () => {
      const expected = [
        'base/demo/first.js',
        'base/demo/second.js'
      ];
      expect(utils.resolveFiles(dict, 'base')).toEqual(expected);
    });

  });

});



