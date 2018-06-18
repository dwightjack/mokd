const url = require('url');
const connect = require('../lib/connect');

describe('Connect middleware', () => {

  let fakeServer;
  let res;
  let req;
  let next;
  let middleware;
  let endpoint;
  let data;



  beforeEach(() => {

    endpoint = {
      response: {},
      contentType: 'demo/text'
    };

    data = {}
    req = {};
    res = {
      setHeader: jest.fn(),
      end: jest.fn(),
    }
    next = jest.fn();

    fakeServer = {
      resolve: jest.fn(() => ({ data, endpoint }))
    };

    middleware = connect(fakeServer)

  });

  test('calls Server#resolve with request object', async () => {
    expect.assertions(1);
    fakeServer.resolve.mockReturnValue({});
    await middleware(req, res, next);
    expect(fakeServer.resolve).toHaveBeenCalledWith(req);
  });

  test('calls the next middleware when no endpoint is returned', async () => {
    expect.assertions(1);
    fakeServer.resolve.mockReturnValue({});
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('sets "Content-Type" header accordingly to the endpoint', async () => {
    expect.assertions(1);
    await middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', endpoint.contentType);
  });

  test('outputs the "data" key value returned by Server#resolve', async () => {
    expect.assertions(1);
    await middleware(req, res, next);
    expect(res.end).toHaveBeenCalledWith(data);
  });

  test('delayed response', (done) => {
    expect.assertions(2);

    endpoint.delay = 1000;

    jest.useFakeTimers();

    middleware(req, res, next).then(
      () => {
        expect(res.end).toHaveBeenCalledTimes(1);
        done();
      }
    );

    expect(res.end).toHaveBeenCalledTimes(0);

    jest.runAllTimers();

  });

});