const koa = require('../lib/koa');

describe('Connect middleware', () => {

  let fakeServer;
  let ctx;
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

    data = 'string'
    req = {};
    ctx = {
      req,
    }
    next = jest.fn();

    fakeServer = {
      resolve: jest.fn(() => ({ data, endpoint }))
    };

    middleware = koa(fakeServer)

  });

  test('calls Server#resolve with request object', async () => {
    expect.assertions(1);
    fakeServer.resolve.mockReturnValue({});
    await middleware(ctx, next);
    expect(fakeServer.resolve).toHaveBeenCalledWith(req);
  });

  test('calls the next middleware when no endpoint is returned', async () => {
    expect.assertions(1);
    fakeServer.resolve.mockReturnValue({});
    await middleware(ctx, next);
    expect(next).toHaveBeenCalled();
  });

  test('calls the next middleware also when an endpoint is returned', async () => {
    expect.assertions(1);
    await middleware(ctx, next);
    expect(next).toHaveBeenCalled();
  });

  test('sets "ctx.type" header accordingly to the endpoint', async () => {
    expect.assertions(1);
    await middleware(ctx, next);
    expect(ctx.type).toBe(endpoint.contentType);
  });

  test('sets "ctx.body" with the "data" key value returned by Server#resolve', async () => {
    expect.assertions(1);
    await middleware(ctx, next);
    expect(ctx.body).toBe(data);
  });

  test('delayed response', (done) => {
    expect.assertions(2);

    endpoint.delay = 1000;

    jest.useFakeTimers();

    middleware(ctx, next).then(
      () => {
        expect(ctx.body).toBe(data);
        done();
      }
    );

    expect(ctx.body).not.toBe(data);

    jest.runAllTimers();

  });

});