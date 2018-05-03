/**
 * Created by wangmin on 2017/7/4.
 */
var path = require('path')
  , util = require('util')


exports = module.exports = tuple('log!normal', function (log) {
    return tuple({rule: /^\/$/, method: 'GET', noAuth: true,options:{a:1}}, function (req, res, next) {
      log.info('Call %s:%j', 'hhgggg', req.query);
      console.log(req._$options_)
      var self = this;
      res.write("aaaaaa");
      res.end();
    })
  });