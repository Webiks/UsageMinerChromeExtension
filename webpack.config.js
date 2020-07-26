const { join } = require('path');

// plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');

const fileExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg'];

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    popup: join(__dirname, 'src', 'popup.js'),
    options: join(__dirname, 'src', 'options.js'),
    background: join(__dirname, 'src', 'background.js')
  },
  output: {
    path: join(__dirname, 'build'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        exclude: /node_modules/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        exclude: /node_modules/,
        use: [
          {loader: 'file-loader'}
        ]
      },
      {
        test: /\.html$/,
        exclude: /node_modules/,
        use: [
          {loader: 'html-loader'}
        ]
      }
      // {
      //   test: /\.js$/, // Run the loader on all .js files
      //   exclude: /node_modules/, // ignore all files in the node_modules folder
      //   use: [
      //     {loader: 'jshint-loader'}
      //   ]
      // }
    ]
  },
  plugins: [
    // clean the build folder
    // new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'Webpack Background',
      template: join(__dirname, 'views', 'background.html'),
      filename: 'background.html',
      chunks: ['background']
    }),
    // new CopyWebpackPlugin({
    //   patterns: [
    //     {
    //       from: 'assets',
    //       to: 'build'
    //     },
    //     {
    //       from: 'views',
    //       to: 'build'
    //     }
    //   ]
    // }),
    new WriteFilePlugin(),
  ],
  resolve: {
    extensions: ['.js']
  }
};