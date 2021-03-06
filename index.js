'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const symlinkOrCopy = require('symlink-or-copy');
const rimraf = require('rimraf');
const MergeTrees = require('merge-trees');

module.exports = class ModuleNormalizer extends Plugin {
  constructor(inputNodes, options) {
    options = options || {};

    super([inputNodes], {
      persistentOutput: true,
      annotation: options.annotation
    });

    this.options = options;
  }

  build() {
    if (this._noChange && symlinkOrCopy.canSymlink) {
      return;
    }

    let inputPath = this.inputPaths[0];
    let outputPath = this.outputPath;
    let inputModulesPath = path.join(inputPath, 'modules');
    let outputModulesPath = path.join(outputPath, 'modules');

    if (!fs.existsSync(inputModulesPath)) {
      if (this._hasRan) {
        fs.unlinkSync(outputPath);
      } else {
        fs.rmdirSync(outputPath);
      }

      symlinkOrCopy.sync(inputPath, outputPath);

      this._noChange = true;
      this._hasRan = true;

      return;
    }

    if (this._hasRan) {
      rimraf.sync(outputPath);
      fs.mkdirSync(outputPath);
    }

    let mergeTrees = new MergeTrees(
      [
        inputPath,
        inputModulesPath
      ],
      this.outputPath,
      {
        overwrite: true,
        annotation: this.options.annotation
      }
    );
    mergeTrees.merge();

    rimraf.sync(outputModulesPath);

    if (this.options.callback) {
      this.options.callback();
    }

    this._hasRan = true;
  }
};
