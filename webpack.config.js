/**
 * Created by lukes on 1/21/2017.
 */
const webpack = require('webpack');
const path = require('path');

const APP_DIR = path.resolve(__dirname, 'src');
const BUILD_DIR = path.resolve(__dirname, 'src/static/js');

module.exports = {
    entry: APP_DIR + '/app-client.js',
    output: {
        path: BUILD_DIR,
        filename: 'bundle.js'
    },
    module: {
        loaders: [{
            test: path.join(__dirname, 'src'),
            loader: ['babel-loader'],
            query: {
                cacheDirectory: 'babel_cache',
                presets: ['react', 'es2015']
            }
        }]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false },
            mangle: true,
            sourcemap: false,
            beautify: false,
            dead_code: true
        })
    ]
};