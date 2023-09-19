/**
 * Created by wangmin on 2018/7/5.
 */
const path = require('path')
const Router =  require('./router');
const util =  require('./util');
const log = require('./logger');
const parseurl = require('parseurl')
const {includePlus, addPlus__, compilePlus__, includeModule, includeUsing, includeUsingChain} = require('./include')
const EventEmitter = require('events').EventEmitter
const createRuler = require('./ruler')


function createLeaf(acl, fn) {
  const self = this
  util.isFunction(acl) && (fn = acl, acl = fn.name);
  if (!util.isFunction(fn)) return;
  let opttype = Object.prototype.toString.call(acl);
  acl = opttype === "[object RegExp]" || opttype === "[object String]" ? {rule: acl} : acl
  acl.rule || (acl.rule = fn.name);
  acl.rule || (acl.rule = '/');
  if (typeof acl.rule === 'string'){
    if (acl.rule[0] === '/'){
      acl.rule = acl.rule.substr(1)
    }
  }
  let domain = acl.domain
  if (self.domain && domain) {
    if (domain.trim().split(',').indexOf(self.domain)<0){
      return
    }
  }
  //fn.rule = acl.rule;
  fn.ruler = createRuler(acl.rule)
  fn.method = acl.method || '*';
  // if (typeof fn.rule === 'string') {
  //   fn.rule = new RegExp('^' + fn.rule + '$', 'i');
  // }
  fn.acl = acl
  // if (!fn.rule) return;
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

async function  addTreeRouters() {
  const self = this
  const start = self.root;
  const log = self.getPlus('log')()
  const allDirs = util.walkDir(self.contextPath,/^\$/);
  for(let i=0;i<allDirs.length;i++){
    const item = allDirs[i]
    await addTreeRouterOne.call(self,item)
  }
  self.allRoutes =  walkRoutes([],start,'')
  self.allRoutes.forEach((item)=>{
    if (self.logLevel === 'info' || self.logLevel === 'debug'){
      log.info(`[controller]${item.ruler.fullRule}`)
    }
  })
}

async function  addTreeRouterOne(item) {
  const self = this
  const log = self.getPlus('log')()
  try {
    const start = self.root;
    const branchs = path.relative(self.contextPath, item).split(path.sep).slice(0, -1);
    let parent = start;
    branchs.forEach(function (branch) {
      branch = branch.toLowerCase();
      parent = parent[branch] || (parent[branch] = emptyNode());
    });
    const routeFns = await includeModule(self, item)
    parent['$$'] = parent['$$'].concat(createLeaves.call(self, routeFns));
  } catch (e) {
    log.error('[controller]',e);
  }
}

function  walkRoutes(all,node,path) {
  const keys = Object.keys(node);
  let key, curNode;
  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    curNode = node[key]
    if (key === '$$') {
      curNode.forEach((leaf) => {
        leaf.ruler.padPath(path)
        all.push({...leaf.acl, path, ruler: leaf.ruler})
      })
    } else {
      walkRoutes(all, curNode, `${path}/${key}`)
    }
  }
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
    let i = 0, branch;
    for (let n = branchs.length; i < n; i++) {
      branch = start[branchs[i]];
      if (!branch) break;
      start = branch;
    }
    const leaf = branchs.slice(i).join('/');
    let fns = start['$$'] || [];
    i = 0;
    let fn, ruler, matchValue;
    for (let n = fns.length; i < n; i++) {
      fn = fns[i];
      ruler = fn.ruler
      if (ruler){
        matchValue = ruler.match(leaf)
        if (matchValue) {
          if (matchValue.params && Object.keys(matchValue.params).length>0){
            req._$params = matchValue.params
          }
          doFn = fn;
          if (ruler.quickRule){
            self.cache[pathname] = fn;
          }
          break;
        }
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
  const usingPlus = async function assembly(fullFile,referenceFile){
    return includeUsing(self, fullFile,referenceFile);
  }
  self.pluses['using'] = usingPlus;
  usingPlus.init = function (referenceFile){
    return includeUsingChain(self, referenceFile)
  }
}

class Controller {
  constructor(options) {
    const self = this
    this.options = options
    this.contextPath = options.contextPath
    this.domain = options.domain
    this.root = emptyNode();
    this.cache = {};
    this.pluses = {log: log, emitter: new EventEmitter()}
    this.beans = []
    this.allRoutes = null;
    this.candidatePluses = {}
    this.logLevel = options.logLevel || 'error'
    this.needPlusMap_ = {}
    this.plusPromises_ =[]
    this.taskPromises_ =[]
    this.RouterClass = Router
    createUsingPlus.call(this)
    this.initCount = 0;

    this._initResolve = null;
    this._initReject = null;
    this._initPromse = new Promise((resolve, reject)=>{
      self._initResolve = resolve
      self._initReject = reject
    })
  }
  buildRouter (req,res,next){
    let pathname = parseurl(req).pathname.toLowerCase()
    const router = createRouter.call(this,pathname,req,res,next)
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
  addPlus (plusFile, extvalue){
    if (!plusFile) return
    const self = this
    if (plusFile === 'log'){
      self.pluses[plusFile] = extvalue
      return;
    }
    if (plusFile && extvalue){
      const name = plusFile;
      const value = extvalue;
      self.plusPromises_.push( addPlus__(self, name,value))
      return;
    }
    self.plusPromises_.push( includePlus(self, plusFile))
  }
  getPlus (name,para){
    let varFn=this.pluses[name];
    if (para!==undefined){
      varFn = varFn(para)
    }
    return varFn
  }
  compile (){
    const self = this
    replaceRouter.call(self);
    (
      async ()=>{
        try{
          await compilePlus__(self)
          await addTreeRouters.call(self)
          self._initResolve()
        }catch (e){
          self._initReject(e)
        }
      }
    )();
  }
  allRouters () {
    let allRoutes =  walkRoutes([],this.root,'')
    return allRoutes
  }



  //used for version 1.x
  get walkDir(){
    return util.walkDir
  }

  get ready(){
    return this.initCount === 0
  }
  await(flag){
    if (flag){
      this.initCount ++
    } else {
      this.initCount --
    }
  }
  awaitAll(){
    let self = this
    const p1 = self._initPromse;
    const p2 = new Promise((resolve, reject)=>{
      let t =  setInterval(() => {
        if (self.ready){
          clearInterval(t);
          resolve()
        }
      },10)
    })
    return Promise.all([p1, p2])
  }
  //used for version 1.x
}

exports=module.exports=Controller

