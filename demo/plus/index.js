/**
 * Created by wangmin on 2018/7/6.
 */
const ExtendRouter = require('../lib/ExtendRouter')
const ExtendRouter2 = require('../lib/ExtendRouter2')
exports = module.exports = function (builder,{logger}) {
  builder.addBean(ExtendRouter({logger,defaultRouter: true}))
    .addBean(ExtendRouter2({logger,defaultRouter:false}))
    .addPlus("./context.js",__dirname)
    .addPlus("./utils.js",__dirname)
    .addPlus("./redis.js",__dirname)
  return builder;
}
