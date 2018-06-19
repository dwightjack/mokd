describe('Main entrypoint', () => {

  const index = require('../index');
  const { Server } = require('../lib/server');

  describe('applyMiddleware', () => {

    let mw;
    let spy;

    beforeEach(() => {
      spy = jest.fn((v) => v);
      mw = index.applyMiddleware(spy);
    });

    test('returns a function', () => {
      expect(mw).toEqual(expect.any(Function));
    });

    test('the returned function executes the parent function argument', () => {
      const server = new Server();
      mw(server);
      expect(spy).toHaveBeenCalledWith(server);
    });

    test('accepts a server configuration object', () => {
      const server = mw({ custom: false });
      expect(server).toEqual(expect.any(Server));
      expect(server.options.custom).toBe(false);
    });

    test('accepts a Server instance', () => {
      const server = new Server();
      expect(mw(server)).toBe(server);
    });

  });

});