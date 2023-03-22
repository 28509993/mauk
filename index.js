/**
 * Created by wangmin on 2018/6/27.
 */
require('./lib/core');
builder=require('./lib/builder');
builder.Router = require('./lib/router');
builder.walkDir = require('./lib/util').walkDir;
exports=module.exports=builder