const path = require('path');
const chokidar = require('chokidar');
const uncached =  require('require-uncached');
const { resolveFiles, uncacheModules } = require('./utils');

const createWatcher = ({ entrypoint, server, paths, watchOptions = {}, cwd = process.cwd() } = {}) => {
  const entrypointPath = path.isAbsolute(entrypoint) ? entrypoint : path.join(cwd, entrypoint);
  const watcherConfig = Object.assign({ ignoreInitial: true, cwd }, watchOptions);
  const watcher = chokidar.watch(paths, watcherConfig);

  watcher.add(entrypointPath);

  const clearCache = () => {

    const files = resolveFiles(watcher.getWatched(), cwd);

    if (files.length > 0) {
      uncacheModules(files);
    }
  }

  const update = (clear = true) => {
    if (clear) {
      clearCache()
    }
    console.log(`Reloading Mock server`);
    server.setEndpoints(uncached(entrypointPath))
  };

  return {
    close: () => watcher.close(),
    on: (...args) => watcher.on(...args),
    clearCache,
    update,
    start: () => {
      update(false);

      watcher.on('all', () => {
        try {
          update();
        } catch (e) {
          console.warn('Unable to reload endpoints', e);
        }
      });
    }
  };

};

module.exports = {
  createWatcher
};