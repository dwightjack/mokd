const path = require('path');
const chokidar = require('chokidar');
const uncached =  require('require-uncached');
const createWatcher = ({ entrypoint, server, paths, watchOptions = {}, cwd = process.cwd() } = {}) => {
  const entrypointPath = path.isAbsolute(entrypoint) ? entrypoint : path.join(cwd, entrypoint);
  const watcherConfig = Object.assign({ ignoreInitial: true, cwd }, watchOptions);
  const watcher = chokidar.watch(paths, watcherConfig);

  watcher.add(entrypointPath);

  const clearCache = () => {

    const files = Object.entries(watcher.getWatched()).reduce((f, [folder, filenames]) => {
      const basePath = path.join(cwd || '', folder);
      f.push(...filenames.map((f) => path.join(basePath, f)));
      return f;
    }, []);

    if (files.length > 0) {
      files.forEach((f) => {
        console.info(`Unloading ${f}`);
        if (require.cache[f]) {
          delete require.cache[f];
        }
      });
    }
  }

  const update = (clear = true) => {
    if (clear) {
      clearCache()
    }
    console.log(`Reloading Mock server`);
    server.setEndpoints(uncached(entrypointPath))
  };

  update(false);

  watcher.on('all', () => {
    try {
      update();
    } catch (e) {
      console.warn('Unable to reload endpoints', e);
    }
  });


  return {
    close: () => watcher.close(),
    on: (...args) => watcher.on(...args),
    update
  };

};

module.exports = {
  createWatcher
};