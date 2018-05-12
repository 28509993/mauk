/**
 * Created by wangmin on 15/6/17.
 */

var fs = require('fs')
  , path = require('path')
  , convertViewTemplate = require('./view-template')

function isFunction(fn) {
  return typeof (fn) === 'function'
}

exports = module.exports = tuple('log!mauk', 'viewEngine', function (log, viewEngine) {
  var app = this;

  function createLeaf(option, fn) {
    var option = option;
    isFunction(option) && (fn = option, option = fn.name);
    if (!isFunction(fn)) return;
    var opttype = Object.prototype.toString.call(option);
    option = opttype === "[object RegExp]" || opttype === "[object String]" ? {rule: option} : option
    option.rule || (option.rule = fn.name);
    fn.rule = option.rule;
    fn.options = option.options || {};
    fn.method = option.method || '*';
    if (typeof (fn.rule) === 'string') {
      fn.rule = new RegExp('^' + fn.rule + '$', 'i');
    }
    option.noAuth && (fn.noAuth = option.noAuth);
    option.view && viewEngine && parseTpl.call(null, option, fn);
    option.waitPost && (fn.waitPost = option.waitPost);
    if (!fn.rule) return;
    return fn;
  };

  function parseTpl(option, fn) {
    if (typeof(option.view) === 'function') {
      fn.view = option.view;
      return;
    }
    //var template = fs.readFileSync(option.view).toString();
    var template = convertViewTemplate.call(null, option.view);
    fn.view = viewEngine.compile(template);
  }

  function findRouteFiles(dir) {
    var fileList = [];

    function walk(targetPath, deepth) {
      if (deepth <= 0) return;
      var dirList = fs.readdirSync(targetPath);
      dirList.forEach(function (item) {
        var fullpath = path.join(targetPath, item);
        if (fs.statSync(fullpath).isFile()) {
          (/^\$/).test(item) && fileList.push(fullpath)
        }
      });
      dirList.forEach(function (item) {
        var fullpath = path.join(targetPath, item);
        if (fs.statSync(fullpath).isDirectory()) {
          walk(fullpath, deepth - 1);
        }
      })
    }

    walk(dir, 4);
    return fileList;
  }

  function createLeaves(leaves) {
    var newLeaves = [];
    leaves && leaves.forEach(function (fn) {
      var fn = fn;
      var leaf = isFunction(fn) ? createLeaf.call(null, fn) : createLeaf.apply(null, fn)
      leaf && newLeaves.push(leaf);
    });
    return newLeaves;
  }

  function emptyNode() {
    return {'$$': []};
  }

  function router() {
    this.root = emptyNode();
    this.cache = {};
  }

  router.prototype.load = function (dir, basePath) {
    var self = this;
    var basePath = typeof (basePath) === 'string' ? basePath.split(path.sep) : [];
    var start = self.root;
    basePath.forEach(function (item) {
      if (!item || typeof(item) !== 'string') return;
      var item = item.toLowerCase();
      start = start[item] ? start[item] : (start[item] = emptyNode())
    });
    findRouteFiles.call(self, dir).forEach(function (item) {
      try {
        var branchs = path.relative(dir, item).split(path.sep).slice(0, -1);
        var parent = start;
        branchs.forEach(function (branch) {
          var branch = branch.toLowerCase();
          parent = parent[branch] || (parent[branch] = emptyNode());
        });
        parent['$$'] = parent['$$'].concat(createLeaves.call(self, include(item)(app)));
      } catch (e) {
        console.log(e);
      }
    });
  }

  router.prototype.use = function (plus) {
    var self = this
    plus = include(plus)(app)
    var doFn = isFunction(plus) ? createLeaf.call(null, plus) : createLeaf.apply(null, plus)
    return function (req, res, next) {
      var url = req._parsedUrl.pathname.toLowerCase();
      if (!(doFn.rule && doFn.rule.test(url)))  return next();
      if (doFn && !doFn.noAuth && !req.isAuthorized()) {
        var err = new Error('This user is not authorized!!----' + __filename)
        err.status = 500;
        next(err);
      } else {
        if (doFn && (doFn.method === '*' || doFn.method === req.method)) {
          req.waitPost && (!doFn.waitPost) && req.waitPost.call(req, function (err) {
            if (err)  return next(err);
            doFn.view && (res.$view = doFn.view);
            req._$options_ = doFn.options
            doFn.call(Object.assign ({app: app, req: req, res: res, next: next}, doFn.modules), req, res, next);
          });
        } else {
          next();
        }
      }
    }
  }

  router.prototype.route = function () {
    var self = this;
    return function (req, res, next) {
      var url = req._parsedUrl.pathname.toLowerCase();
      var doFn = self.cache[url];
      if (!doFn) {
        var branchs = url.replace(/^\//, '').split('/');
        branchs[0] || (branchs[0] = '/')
        var start = self.root;
        var i = 0;
        for (var n = branchs.length; i < n; i++) {
          var branch = start[branchs[i]];
          if (!branch) break;
          start = branch;
        }
        var leaf = branchs.slice(i).join('/');
        //console.log(leaf);
        var fns = start['$$'] || [];
        i = 0;
        for (var n = fns.length; i < n; i++) {
          var fn = fns[i];
          if (fn.rule && fn.rule.test(leaf)) {
            doFn = fn;
            self.cache[url] = fn;
            break;
          }
        }
      }

      if (doFn && !doFn.noAuth && !req.isAuthorized()) {
        var err = new Error('This user is not authorized!!----' + __filename)
        err.status = 500;
        next(err);
      } else {
        if (doFn && (doFn.method === '*' || doFn.method === req.method)) {
          req.waitPost && (!doFn.waitPost) && req.waitPost.call(req, function (err) {
            if (err)  return next(err);
            doFn.view && (res.$view = doFn.view);
            req.$options = doFn.options
            doFn.call(Object.assign ({app: app, req: req, res: res, next: next}, doFn.modules), req, res, next);
          });
        } else {
          next();
        }
      }
    }
  }

  return function () {
    return new router();
  }
  //return router;

})
