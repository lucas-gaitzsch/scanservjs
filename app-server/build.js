const fse = require('fs-extra');
const dist = './dist';
const options = { overwrite: true };

async function assemble() {
  await fse.copy('./src', `${dist}/server`, options);
  await Promise.all([
    'package.json',
    'config/config.default.js',
    'data/preview/default.jpg'
  ].map(path => fse.copy(path, `${dist}/${path}`, options)));
}

assemble();
