const path = require('path')

//To build me
// npx webpack --config app.webpack.config.js
module.exports = {
  entry: './src/app.js',
  devtool: 'source-map',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'dist')
  }
}