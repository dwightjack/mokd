const path = require('path');
const chokidar = require('chokidar');
const uncached =  require('require-uncached');
const { resolveFiles, uncacheModules } = require('./utils');

const createWatcher = ({ entrypoint, server, paths = [], watchOptions = {}, cwd = process.cwd() } = {}) => {
  const entrypointPath = path.isAbsolute(entrypoint) ? entrypoint : path.join(cwd, entrypoint);
  const watcherConfig = Object.assign({ ignoreInitial: true, cwd }, watchOptions);
  let watcher

  return {
    close: () => watcher.close(),
    on: (...args) => watcher.on(...args),

    clearCache() {
      const files = resolveFiles(watcher.getWatched(), cwd);

      if (files.length > 0) {
        uncacheModules(files, true);
      }
    },

    update(clear = true) {
      if (clear) {
        this.clearCache();
      }
      console.log(`Reloading Mock server`);
      server.setEndpoints(uncached(entrypointPath))
    },

    setWatcher() {
      watcher = chokidar.watch(paths, watcherConfig);
      watcher.add(entrypointPath);
    },

    start() {
      this.setWatcher()
      try {
        this.update(false);
      } catch (e) {
        console.warn('Unable to load endpoints', e);
      }

      watcher.on('all', () => {
        try {
          this.update();
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