var path = require('path')
  , express = require('express')
  , servestatic = require('serve-static')
  , favicon = require('serve-favicon')
  , util = require('util')
  , IncomingMessage = require('http').IncomingMessage
  , formidable = require('formidable')
  //,logger=require('./lib/logger')
  , mauk = require('../lib')


var extend = {
  viewEngine: require('ejs'),
  //_: require('underscore'),
  //Promise: require('q'),
  //log: logger
}


IncomingMessage.prototype.isAuthorized = function () {
  //can be override isAuthorized
  return true;
}

IncomingMessage.prototype.waitPost = function (fn) {
  //can be override
  var req = this;
  if (req.method !== 'POST') return fn();

  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields) {
    util._extend(req.query, fields);
    fn(err);
  })
}


exports = module.exports = function (options) {
  var app = express({strict: true});
  //mauk.requireConfig.call(app,extend); 废弃
  //add 增加 import的库或者函数
  app.extend = extend;
  var tree = mauk.treeRouter(app)({domain:'api'});
  tree.load(path.resolve('app/main'));
  //tree.load(__dirname);
  //app.use(tree.use(require('./demo/aplus')))
  app.use(servestatic('public', {redirect: false}))
    .use(favicon('./app/favicon.ico'))
    .use(tree.route());
  return app;
}

console.log(__dirname)






