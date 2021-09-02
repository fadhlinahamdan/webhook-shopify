const webpack = require('webpack');
const slsw = require('serverless-webpack');
module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
};