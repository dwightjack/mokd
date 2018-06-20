const chokidar = require('chokidar');



describe('Watcher', () => {

  let createWatcher;
  let config;
  let watcher;
  let server;

  beforeAll(() => {
    jest.mock('../lib/utils');

    jest.mock('require-uncached', () => {
      return jest.fn(() => []);
    });

    createWatcher = require('../lib/watcher').createWatcher;

  });

  beforeEach(() => {

    server = {
      setEndpoints: jest.fn()
    }

    watcher = {
      add: jest.fn(),
      getWatched: jest.fn(),
      on: jest.fn(),
      close: jest.fn()
    };

    jest.spyOn(chokidar, 'watch');
    chokidar.watch.mockImplementation(() => watcher);

    config = {
      entrypoint: 'config.js',
      paths: [],
      server,
      watchOptions: { custom: true },
      cwd: './demo'
    };
  });

  afterEach(() => {
    chokidar.watch.mockRestore();
  });

  describe('Setup', () => {

    test('"entrypoint" is a required parameter', () => {
      expect(() => {
        createWatcher();
      }).toThrow();

      expect(() => {
        createWatcher({ entrypoint: 'config.js' });
      }).not.toThrow();
    });

    test('returns an object instance', () => {
      const inst = createWatcher({ entrypoint: 'config.js' });
      expect(inst).toEqual(expect.any(Object));
    });

    test('creates a chokidar watcher', () => {
      createWatcher(config);
      expect(chokidar.watch).toHaveBeenCalled();
    });

    test('passes "config.paths" to the watcher', () => {
      createWatcher(config);
      expect(chokidar.watch).toHaveBeenCalledWith(config.paths, expect.any(Object))
    });

    test('passes an enhanced "config.watcherOptions" to the watcher', () => {
      createWatcher(config);
      const [, options] = chokidar.watch.mock.calls[0];
      const expected = {
        cwd: config.cwd,
        custom: true,
        ignoreInitial: true
      };
      expect(options).toEqual(expected)
    });

    test('default watcher options can be overwritten', () => {
      config.watchOptions = { ignoreInitial: false };
      config.cwd = 'demo';

      createWatcher(config);

      const [, options] = chokidar.watch.mock.calls[0];
      const expected = {
        cwd: 'demo',
        ignoreInitial: false
      };
      expect(options).toEqual(expected)
    });

    test('adds "config.entrypoint" to the watched file list', () => {
      createWatcher(config);
      expect(watcher.add).toHaveBeenCalled();
    });

    test('resolves entrypoint path from cwd', () => {
      const { join } = require('path');
      createWatcher(config);
      expect(watcher.add).toHaveBeenCalledWith(join(config.cwd, config.entrypoint));
    });

    test('does NOT resolve absolute paths', () => {
      config.entrypoint = '/config.js';
      createWatcher(config);
      expect(watcher.add).toHaveBeenCalledWith(config.entrypoint);
    });

  });

  describe('.close', ()=> {

    test('proxies to chokidar\'s close method', () => {
      const inst = createWatcher(config);
      inst.close()
      expect(watcher.close).toHaveBeenCalled();
    });
  });

  describe('.on', () => {
    test('proxies to chokidar\'s on method', () => {
      const inst = createWatcher(config);
      const args = ['all', true];
      inst.on(...args);
      expect(watcher.on).toHaveBeenCalledWith(...args);
    });
  });

  describe('.clearCache', () => {

    const fileMap = {};

    let inst;
    let utils;

    beforeEach(() => {
      utils = require('../lib/utils');
      inst = createWatcher(config);
      watcher.getWatched.mockReturnValue(fileMap);
    });

    test('resolve watched files to an array of paths', () => {
      utils.resolveFiles.mockReturnValue([]);
      inst.clearCache();

      expect(watcher.getWatched).toHaveBeenCalled();
      expect(utils.resolveFiles).toHaveBeenCalledWith(fileMap, config.cwd);

    });

    test('when the resolved array has length > 0 calls "uncacheModules" on it', () => {
      const files = ['file.js'];
      utils.resolveFiles.mockReturnValue(files);
      inst.clearCache();

      expect(utils.uncacheModules).toHaveBeenCalledWith(files, true);
    });


  });

  describe('.update', () => {

    let inst;

    beforeEach(() => {
      inst = createWatcher(config);
      jest.spyOn(inst, 'clearCache');
    });

    afterEach(() => {
      inst.clearCache.mockRestore();
    });

    test('clears modules', () => {
      inst.update();
      expect(inst.clearCache).toHaveBeenCalled();
    });

    test('do NOT clears modules', () => {
      inst.update(false);
      expect(inst.clearCache).not.toHaveBeenCalled();
    });

    test('tries to load a fresh copy of the entrypoint', () => {
      const expected = 'demo/config.js';
      const uncached = require('require-uncached');
      inst.update();
      expect(uncached).toHaveBeenCalledWith(expected);
    });

    test('sets updated endpoints', () => {
      const expected = [];
      const uncached = require('require-uncached');
      uncached.mockReturnValue(expected);
      inst.update();
      expect(server.setEndpoints).toHaveBeenCalledWith(expected);
    });

  });

  describe('.start', () => {

    let inst;
    let handler;

    beforeEach(() => {
      inst = createWatcher(config);
      jest.spyOn(inst, 'update');
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      watcher.on.mockImplementation((e, fn) => { handler = fn })
    });

    afterEach(() => {
      console.warn.mockReset();
    });

    afterAll(() => {
      console.warn.mockRestore();
    });

    test('calls "update" without clearing che cache', () => {
      inst.start();
      expect(inst.update).toHaveBeenCalledWith(false);
    });

    test('enqueues an "all" event handler into the watcher', () => {
      inst.start();
      expect(watcher.on).toHaveBeenCalledWith('all', expect.any(Function));
    });

    test('the handler calls "update"', () => {
      inst.start();

      //call the enqueued handler
      handler();
      expect(inst.update).toHaveBeenCalled();
    });

    test('on initialization error logs a warning', () => {
      const e = new Error('update');
      jest.spyOn(inst, 'update').mockImplementation(() => { throw e });

      expect(() => {
        inst.start();
      }).not.toThrow();

      expect(console.warn).toHaveBeenCalledWith(expect.any(String), e);

    });

    test('the handler logs a warning as well', () => {
      const e = new Error('update');
      jest.spyOn(inst, 'update').mockImplementation(() => { throw e });

      inst.start();
      handler();

      expect(console.warn).toHaveBeenCalledWith(expect.any(String), e);

    });

  });

});