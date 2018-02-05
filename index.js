'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const symlinkOrCopy = require('symlink-or-copy');

const symlinkOrCopySync = symlinkOrCopy.sync;

module.exports = class ModuleNormalizer extends Plugin {
  constructor(input) {
    super([input], {
      persistentOutput: true,
    });

    this._hasRan = false;
  }

  build() {
    if (this._hasRan && symlinkOrCopy.canSymlink) { return; }

    let symlinkSource;

    let modulesPath = path.join(this.inputPaths[0], 'modules');
    if (fs.existsSync(modulesPath)) {
      symlinkSource = modulesPath;
    } else {
      symlinkSource = this.inputPaths[0];
    }

    if (this._hasRan) {
      fs.unlinkSync(this.outputPath);
    } else {
      fs.rmdirSync(this.outputPath);
    }

    symlinkOrCopySync(symlinkSource, this.outputPath);
    this._hasRan = true;
  }
}
