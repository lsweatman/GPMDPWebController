/**
 * Created by lukes on 1/21/2017.
 */
const path = require('path');
const BUILD_DIR = path.resolve(__dirname, 'src/static/js');

module.exports = {
  entry: {
    js: './src/app-client.js',
    vendor: ['react']
  },
  output: {
    path: BUILD_DIR,
    filename: '[name].bundle.js'
  },
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: ['babel-loader']
    }],
  },
};
