const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  chainWebpack: config => {
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap(options => {
        options.compilerOptions = {
          ...options.compilerOptions,
          isCustomElement: tag => tag.startsWith("ion-")
        }
        return options
      })

    config
      .plugin("copy-webpack-plugin")
      .use(CopyPlugin)
      .tap(() => {
        return [{
          patterns: [
            {
              from: "./node_modules/upscalejs/dist/js/ort-*.wasm",
              to: "js/[name][ext]",
            },
            {
              from: "./node_modules/upscalejs/dist/models/*.onnx",
              to: "models/[name][ext]",
            }
          ],
        }]
      })

    config.optimization.minimizer("terser").tap((args) => {
      args[0].terserOptions.output = {
        ...args[0].terserOptions.output,
        comments: false
      }
      args[0].terserOptions.compress.drop_console = true
      return args
    })
  },
  transpileDependencies: ["color"],
  publicPath: process.env.NODE_ENV === "production"
    ? "/3x3-generator/"
    : "/"
}
