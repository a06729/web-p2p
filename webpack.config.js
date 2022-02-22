const path = require('path');
module.exports = {
    mode: 'development',
    entry: {
      app:'./src/public/js/app.js',
    },
    output: {
      filename: '[name]-bundel.js',
      path: path.resolve(__dirname, 'src/public/js/bundel'),
    },
    module:{
      rules:[
        {
          test:/\.css$/,
          use:[
            'style-loader',
            'css-loader',
          ]
        }
      ]
    },
  };