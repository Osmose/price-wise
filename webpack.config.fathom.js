/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Webpack configuration for Fathom training.
 */

/* eslint-env node */

const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'eval-source-map',
  target: 'web',
  entry: {
    train: './src/extraction/train',
  },
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: {
          loader: 'null-loader',
        },
      },
      // jsdom is imported by fathom-web utils.js; it's only used for testing
      {
        test: /jsdom.*/,
        use: {
          loader: 'null-loader',
        },
      },
    ],
  },
  node: {
    fs: 'empty',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: 'const marionetteScriptFinished = arguments[0];',
      raw: true,
      entryOnly: true,
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      commerce: path.resolve(__dirname, 'src'),
    },
  },
};
