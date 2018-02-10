'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const symlinkOrCopy = require('symlink-or-copy');
const walkSync = require('walk-sync');
const rimraf = require('rimraf');

const symlinkOrCopySync = symlinkOrCopy.sync;

module.exports = class ModuleNormalizer extends Plugin {
  constructor(input, options) {
    options = options || {};

    super([input], {
      persistentOutput: true,
      annotation: options.annotation
    });

    this.options = options;

    this._hasRan = false;
  }

  build() {
    if (this._hasRan && symlinkOrCopy.canSymlink) {
      return;
    }

    let inputPath = this.inputPaths[0];
    let outputPath = this.outputPath;

    let modulesPath = path.join(inputPath, 'modules');
    let modules;
    if (fs.existsSync(modulesPath)) {
      modules = fs.readdirSync(modulesPath);

      if (!this._hasRan) {
        if (this.options.callback) {
          this.options.callback();
        }
      }
    } else {
      modules = [];
    }

    if (this._hasRan) {
      rimraf.sync(outputPath);
      fs.mkdirSync(outputPath);
    }

    let dirs = fs.readdirSync(inputPath).filter(dir => dir !== 'modules');

    let intersection = dirs.filter(dir => modules.indexOf(dir) !== -1);
    let modulesOnly = modules.filter(dir => dirs.indexOf(dir) === -1);
    let nonModules = dirs.filter(dir => modules.indexOf(dir) === -1);

    for (let dir of intersection) {
      let files = [[dir, dir]]
        .concat(walkSync(path.join(modulesPath, dir)).map(file => [path.join('modules', dir, file), path.join(dir, file)]))
        .concat(walkSync(path.join(inputPath, dir)).map(file => [path.join(dir, file), path.join(dir, file)]));

      let visited = new Set();

      for (let pair of files) {
        if (visited.has(pair[1])) {
          continue;
        }

        let inputFilePath = path.join(inputPath, pair[0]);
        let outputFilePath = path.join(outputPath, pair[1]);

        if (fs.statSync(inputFilePath).isDirectory()) {
          fs.mkdirSync(outputFilePath);
        } else {
          symlinkOrCopySync(inputFilePath, outputFilePath);
        }

        visited.add(pair[1]);
      }
    }

    let files = modulesOnly.map(file => [path.join('modules', file), file])
      .concat(nonModules.map(file => [file, file]));

    for (let pair of files) {
      let inputDirPath = path.join(inputPath, pair[0]);
      let outputDirPath = path.join(outputPath, pair[1]);

      symlinkOrCopySync(inputDirPath, outputDirPath);
    }

    this._hasRan = true;
  }
};
