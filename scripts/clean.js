#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  path.join(PROJECT_ROOT, 'docs', 'index.html'),
  path.join(PROJECT_ROOT, 'docs', 'readme.md'),
  path.join(PROJECT_ROOT, 'docs', 'spec.yaml'),
  path.join(PROJECT_ROOT, 'coverage'),
  path.join(PROJECT_ROOT, 'logs'),
  path.join(PROJECT_ROOT, 'tmp'),
  path.join(PROJECT_ROOT, '..', 'monitoring', 'exports')
];

const removePath = (target) => {
  if (!fs.existsSync(target)) {
    return;
  }

  const stats = fs.statSync(target);

  if (stats.isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.unlinkSync(target);
  }
};

const main = () => {
  TARGETS.forEach((target) => {
    try {
      removePath(target);
      console.log(`🧹 removed ${target}`);
    } catch (error) {
      console.warn(`Unable to remove ${target}: ${error.message}`);
    }
  });

  // Re-create exports directory placeholder.
  const exportsDir = path.join(PROJECT_ROOT, '..', 'monitoring', 'exports');
  fs.mkdirSync(exportsDir, { recursive: true });
  fs.writeFileSync(path.join(exportsDir, '.gitkeep'), '', 'utf8');

  console.log('Clean completed.');
};

main();

