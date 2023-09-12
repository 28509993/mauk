const { pathToRegexp, match, parse, compile } = require("path-to-regexp");


function Ruler(rule){
  this.rule__ = rule
  this.fullRule = null
  this.quickRule = null;
  this.match__ = null;
}

Ruler.prototype.match = function (pathname){
  return this.match__(pathname)
}


Ruler.prototype.padPath = function (path) {
  const self = this
  if (typeof this.rule__ === 'string') {
    this.fullRule = `${path}/${this.rule__}`
    const keys = []
    const regexp = pathToRegexp(this.rule__, keys, {strict: true});
    if (regexp.source  === `^${this.rule__}$`){
      this.quickRule = this.fullRule
    }
    const matchFn = match(this.rule__, {strict: true})
    this.match__ = function (pathname){
      return matchFn(pathname)
    }
  } else if (typeof this.rule__ === 'function') {
    this.fullRule = `${path}/__fn`
    this.match__ = function (pathname){
      return self.rule__(pathname)
    }
  } else  {
    this.fullRule = `${path}/${this.rule__.toString()}`
    this.match__ = function (pathname){
      return self.rule__.test(pathname)
    }
  }
}

exports=module.exports = function createRuler(rule){
  return new Ruler(rule)
}

//
//
// const ss = 'aa/foo/bar'
// const keys = []
// const regexp = pathToRegexp(ss, keys, {strict: true});
// const fstr = regexp.source;
//
//
//
// let dd =  regexp.exec("aha/f1/f2")
//
//
//
// let fn = match("/user/:id", {strict: true});
// let dz = fn('/user/464784')
//
// fn = match("/user", {strict: true});
// dz = fn('/user')
//
// fn = match("/user/:file(aa.pdf|aa.html)", {strict: true});
// dz = fn('/user/aa.html')
//
//
//
// console.log(regexp)