/**
 * Created by wangmin on 2018/7/5.
 */
const path = require('path')
const Router =  require('./router');
const util =  require('./util');
const log = require('./logger');
const parse = require('parseurl')
const EventEmitter = require('events').EventEmitter

function createLeaf(acl, fn) {
  const self = this
  util.isFunction(acl) && (fn = acl, acl = fn.name);
  if (!util.isFunction(fn)) return;
  let opttype = Object.prototype.toString.call(acl);
  acl = opttype === "[object RegExp]" || opttype === "[object String]" ? {rule: acl} : acl
  acl.rule || (acl.rule = fn.name);
  let domain = acl.domain
  if (self.domain && domain) {
    if (domain.trim().split(',').indexOf(self.domain)<0){
      return
    }
  }
  fn.rule = acl.rule;
  fn.method = acl.method || '*';
  if (typeof (fn.rule) === 'string') {
    fn.rule = new RegExp('^' + fn.rule + '$', 'i');
  }
  fn.acl = acl
  if (!fn.rule) return;
  return fn;
};

function createLeaves(leaves) {
  const newLeaves = [];
  const self = this
  const createLeafBind = createLeaf.bind(self)
  leaves && leaves.forEach(function (fn) {
    let leaf = util.isFunction(fn) ? createLeafBind(fn) : createLeafBind(...fn);
    leaf && newLeaves.push(leaf);
  });
  return newLeaves;
}

function  addTreeRouters() {
  const self = this
  const start = self.root;
  const createLeavesBind = createLeaves.bind(self)
  const log = self.getPlus('log')()
  util.walkDir(self.contextPath,/^\$/).forEach(function (item) {
    try {
      const branchs = path.relative(self.contextPath, item).split(path.sep).slice(0, -1);
      let parent = start;
      branchs.forEach(function (branch) {
        branch = branch.toLowerCase();
        parent = parent[branch] || (parent[branch] = emptyNode());
      });
      parent['$$'] = parent['$$'].concat(createLeavesBind(include(item).bind(self)()));
    } catch (e) {
      log.error('[controller]',e);
    }
  });
  self.allRoutes =  walkRoutes([],start,'')
  self.allRoutes.forEach((item)=>{
    log.info(`[controller]${item.fullRule}`)
  })
}

function  walkRoutes(all,node,path) {
  Object.keys(node).forEach((key)=>{
    let curNode = node[key]
    if (key==='$$'){
      curNode.forEach((leaf)=>{
        all.push({...leaf.acl,fullRule:`${path}/${leaf.acl.rule.toString()}`})
      })
    } else {
      walkRoutes(all,curNode,`${path}/${key}` )
    }
  })
  return all;
}

function emptyNode() {
  return {'$$': []};
}

function createRouter (pathname,req,res,next){
  const self = this
  let doFn = self.cache[pathname];
  if (!doFn) {
    let branchs = pathname.replace(/^\//, '').split('/');
    branchs[0] || (branchs[0] = '/')
    let start = self.root;
    let i = 0;
    for (let n = branchs.length; i < n; i++) {
      const branch = start[branchs[i]];
      if (!branch) break;
      start = branch;
    }
    const leaf = branchs.slice(i).join('/');
    let fns = start['$$'] || [];
    i = 0;
    for (let n = fns.length; i < n; i++) {
      let fn = fns[i];
      if (fn.rule && fn.rule.test(leaf)) {
        doFn = fn;
        self.cache[pathname] = fn;
        break;
      }
    }
  }

  if (doFn && (doFn.method === '*' || doFn.method === req.method)) {
    let RouterClass = this.RouterClass
    if (doFn.acl.routerClass){
      let bean = this.getBean(doFn.acl.routerClass);
      if (util.isClass(bean,Router)){
        RouterClass = bean;
      }
    }
    return new RouterClass(pathname,doFn,this,doFn.acl,req,res,next)
  }

}

function replaceRouter() {
  this.beans.forEach((item) => {
    if (util.isClass(item,Router)&& item.defaultRouter){
      this.RouterClass = item
    }
  })
}

function createUsingPlus(){
  const self = this
  const usingPlus = function usingPlus(fullFile,referenceFile){
    if (referenceFile){
      fullFile = path.resolve(referenceFile, fullFile);
    }
    const fns = include(fullFile).bind(self)()
    const fnMap = {}
    if (Array.isArray(fns)){
      fns.forEach(function (item){
        if (item.name){
          fnMap[item.name] = item;
        }
      })
    } else if (Object.prototype.toString.call(fns) === '[object Object]') {
      Object.assign(fnMap,fns)
    }
    return fnMap;
  }
  self.pluses['using'] = usingPlus
  usingPlus.init =function (referenceFile){
    let plusBuilder = {}
    let plusSet = {};
    plusBuilder.add = function  add(filePath) {
      Object.assign(plusSet,usingPlus(filePath, referenceFile))
      return plusBuilder;
    }
    plusBuilder.build = function  build() {
      return plusSet;
    }
    return plusBuilder;
  }
}




// function createPlusProxy(plusObj){
//   const p = new Proxy(plusObj, {
//     get(target, prop) {
//       if (prop in target) {
//         return target[prop];
//       } else {
//         throw new Error(`property[${prop}]  not exists`)
//       }
//     },
//     set(target, prop, value) {
//       target[prop] = value;
//     },
//     has: (target, key) => {
//       return key in target;
//     }
//   })
//   return p;
// }



class Controller {
  constructor(options) {
    this.options = options
    this.contextPath = options.contextPath
    this.domain = options.domain
    this.root = emptyNode();
    this.cache = {};
    this.pluses = {log: log, emitter: new EventEmitter()}
    this.createRouter = createRouter.bind(this);
    this.beans = []
    this.initCount = 0;
    this.allRoutes = null;
    this.RouterClass = Router
    createUsingPlus.bind(this)()
  }
  buildRouter (req,res,next){
    let pathname = parse(req).pathname.toLowerCase()
    const router = this.createRouter(pathname,req,res,next)
    return router
  }
  addBean (beanClass){
    this.beans.push(beanClass)
  }
  getBean (beanName){
    let bean = null
    for(let i=0; i<this.beans.length;i++){
      const item = this.beans[i]
      if (item.name === beanName){
        bean = item
      }
    }
    return bean;
  }
  __addPlus (name,value){
    this.pluses[name] = value
  }
  addPlus (plusFile,extvalue){
    if (!plusFile) return
    const self = this
    if (plusFile && extvalue){
      const name  =plusFile;
      const value  =extvalue;
      self.__addPlus(name,value)
      return;
    }

    include(plusFile).bind(this)(({fn,plus}) => {
      self.pluses[fn.name] = plus
    })
  }
  getPlus (name,para){
    let varFn=this.pluses[name];
    if (para!==undefined){
      varFn = varFn(para)
    }
    return varFn
  }
  compile (){
    replaceRouter.bind(this)()
    addTreeRouters.bind(this)()
  }
  allRouters () {
    let allRoutes =  walkRoutes([],this.root,'')
    return allRoutes
  }

  await(flag){
    if (flag){
      this.initCount ++
    } else {
      this.initCount --
    }
  }
  get walkDir(){
    return util.walkDir
  }

  get ready(){
    return this.initCount === 0
  }



}

exports=module.exports=Controller

