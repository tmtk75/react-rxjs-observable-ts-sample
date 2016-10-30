module.exports = {

  target: "electron",

  entry: {
    bundle: "./src/index.tsx",
    a: "./src/a.ts",
  },

  output: {
    path: "./dist",
    filename: "[name].js"
  },

  resolve: {
    extensions: ["", ".js", ".ts", ".tsx"]
  },

  module: {
    loaders: [
      { test: /\.js$/,   loader: 'babel?cacheDirectory', exclude: /node_modules/ },
      { test: /\.tsx?$/, loader: "ts-loader" },
    ]
  },

  devtool: "source-map",

  debug: true,

};
