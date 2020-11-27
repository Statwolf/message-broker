const { resolve } = require('path');

module.exports = {
  entry: resolve(__dirname, 'index.js'),
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'app.bundle.js'
  },
  target: 'node'
};
