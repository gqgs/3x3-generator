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

    config.optimization.minimizer("terser").tap((args) => {
      args[0].terserOptions.output = {
        ...args[0].terserOptions.output,
        comments: false
      }
      args[0].terserOptions.compress.drop_console = true
      return args
    })
  },
  publicPath: process.env.NODE_ENV === "production"
    ? "/3x3-generator/"
    : "/"
}
