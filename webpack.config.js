const path = require('path');
const webpack = require('webpack');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const isProd = process.env.NODE_ENV === 'production';
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Phaser webpack config
const phaserModule = path.join(__dirname, '/node_modules/phaser/');
const phaser = path.join(phaserModule, 'build/custom/phaser-split.js');
const pixi = path.join(phaserModule, 'build/custom/pixi.js');
const p2 = path.join(phaserModule, 'build/custom/p2.js');

module.exports = {
  entry: {
    app: [
      'babel-polyfill',
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: "[name]-bundle-[hash].js",
    publicPath: '/'
  },
  watch: !isProd,
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'template.html',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ].concat(isProd ? [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compress: {
        warnings: false,
      },
    }),
  ] : [
    new BrowserSyncPlugin({
      host: process.env.IP || 'localhost',
      port: process.env.PORT || 3000,
      open: false,
      server: {
        baseDir: ['./public'],
      },
    }),
  ]),
  module: {
    loaders: [
      { test: /pixi\.js/, loader: 'expose?PIXI' },
      { test: /phaser-split\.js$/, loader: 'expose?Phaser' },
      { test: /p2\.js/, loader: 'expose?p2' },
      {
        test: /\.json$/, loader: 'json', exclude: path.join(__dirname, 'node_modules'),
      }, {
        test: /\.js?$/,
        loader: 'babel',
        exclude: /node_modules/,
        include: path.resolve(__dirname, 'src'),
      }, {
        test: /\.less$/,
        loader: 'style!css!less',
      }, {
        test: /\.css$/,
        loader: 'style!css',
      }, {
        test: /\.woff|\.woff2|\.svg|.eot|\.ttf/,
        loader: 'url?prefix=font/&limit=10000&name=[name]-fp-[hash].[ext]',
      }, {
        test: /\.mp3$/,
        loader: 'file?hash=sha512&digest=hex&name=[name]-fp-[hash].[ext]',
      }, {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loaders: [
          'url?limit=10000&name=[name]-fp-[hash].[ext]',
          'img?minimize',
        ],
      }, {
        test: /\.xml$/,
        loader: 'file?hash=sha512&digest=hex&name=[name]-fp-[hash].[ext]',
      },
    ],
  },
  imagemin: {
    optipng: { optimizationLevel: 7 },
    // pngquant: {
    //   quality: '65-90',
    //   speed: 4,
    // },
  },
  node: {
    fs: 'empty',
  },
  resolve: {
    root: __dirname,
    alias: {
      app: path.join(__dirname, 'src'),
      assets: path.join(__dirname, 'assets'),
      phaser,
      pixi,
      p2,
    },
  },
};
