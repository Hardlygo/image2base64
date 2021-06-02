const CompressionWebpackPlugin = require("compression-webpack-plugin");
const IS_PROD = ["production", "prod"].includes(process.env.NODE_ENV);
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;


module.exports = {
    publicPath: IS_PROD ? "https://github.hardly.website/image2base64/" : "./", // 默认'/'，部署应用包时的基本 URL
    lintOnSave: false,
    runtimeCompiler: true, // 是否使用包含运行时编译器的 Vue 构建版本
    productionSourceMap: !IS_PROD, // 生产环境的 source map
    parallel: require("os").cpus().length > 1,
    configureWebpack: config => {
        const plugins = [];
        if (IS_PROD) {
          plugins.push(
            new CompressionWebpackPlugin({
              filename: "[path].gz[query]",
              algorithm: "gzip",
              test: productionGzipExtensions,
              threshold: 10240,
              minRatio: 0.8
            })
          );
        }
        config.plugins = [...config.plugins, ...plugins];
      },

};
