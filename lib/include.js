/**
 * Created by wangmin on 2018/7/5.
 */
const path = require('path')

let isCjs = true
async function importFile(fullFile){
  let defines;
  try{
    if (isCjs){
      defines =  require(fullFile)
      isCjs = true
    } else {
      const {default: defines_} = await import(fullFile);
      defines = defines_
      isCjs = false
    }

  }catch (e){
    if (e.code ==='ERR_REQUIRE_ESM'){
      isCjs = false
      const {default: defines_} = await import(fullFile);
      defines =  defines_;
    } else {
      throw e
    }
  }
  return defines;
}

async function include(controller, fullFile, referenceFile){
  const self = controller
  if (referenceFile){
    fullFile = path.resolve(referenceFile, fullFile);
  }
  let defines = await importFile(fullFile)
  let pn=defines.length;
  if (pn<0 || typeof (defines[pn-1] )!=='function') {
    throw new Error(fullFile)
  }
  let contextfn = defines[pn-1];
  //let vars = []
  let varPluses = defines.slice(0, defines.length - 1)
  // if (pn>1){
  //   vars = contextfn.toString().match(/\(([^|()]*)\)/);
  //   vars = !vars?[]:vars[1].replace(/\s/,'').split(',');
  // }
  // if (vars.length !==varPluses.length){
  //   throw new Error(`inject parameter count error! file: ${fullFile}`)
  // }
  return {name: contextfn.name, contextfn, varPluses}
}

async function addPlusOfAssemble__(controller, plus) {
  const self = controller
  let {plusName, contextfn, varPluses} = plus
  if (hasPlus(self.pluses, plusName)) {
    return;
  }
  let i = 0;
  let varPlusOk = true
  for (i = 0; i < varPluses.length; i++) {
    let varPlusName = varPluses[i];
    let plusFnReg = (/^([^!]+)(!([\s\S]*))$/i).exec(varPlusName);
    if (plusFnReg) {
      varPlusName = plusFnReg[1]
    }
    self.needPlusMap_[varPlusName] = varPlusName
    if (!hasPlus(self.pluses, varPlusName)) {
      varPlusOk = false;
    }
  }
  if (varPlusOk) {
    let varArgs = await assemblyParameters(self, varPluses)
    const plusFunc = contextfn
    const varValue = typeof plusFunc === 'function' ? plusFunc.call(self, ...varArgs) : plusFunc;
    addPlus__(self, plusName, varValue)
  } else {
    addPlus__(self, plusName, plus)
  }
}

async function assemblyParameters(controller, varPluses){
  const self = controller
  let i;
  let varArgs = [];
  for (i = 0; i < varPluses.length; i++) {
    let varName = varPluses[i];
    let varValue = self.pluses[varName];
    const plusFnReg = (/^([^!]+)(!([\s\S]*))$/i).exec(varName);
    if (plusFnReg){
      varName = plusFnReg[1]
      const func = self.pluses[varName];
      varValue = typeof func === 'function' ? func(plusFnReg[3]) : func;
      if (varValue instanceof  Promise){
        varValue = await varValue
      }
    }
    varArgs.push(varValue)
  }
  return varArgs
}

async function includeModule(controller, fullFile,referenceFile){
  const self = controller
  const {contextfn, varPluses} = await include(self, fullFile,referenceFile)
  let varArgs = [] = await assemblyParameters(self, varPluses)
  const contextObj = contextfn.call(self, ...varArgs);
  return contextObj;
}



async function includePlus(controller, fullFile,referenceFile){
  const self = controller
  const {name: plusName, contextfn, varPluses} = await include(self, fullFile,referenceFile)
  if (!plusName){
    throw new Error("plus name is empty!")
  }
  await addPlusOfAssemble__(self, {plusName, contextfn, varPluses})
}

function hasPlus(pluses, name){
  let plusName = Object.keys(pluses);
  if (Object.keys(pluses)){
    for (let i = 0; i < plusName.length; i++) {
      if (plusName[i] === name) {
        return true;
      }
    }
  }
  return false;
}


function addPlus__ (controller, name,value) {
  let self = controller
  if (hasPlus(self.pluses, name)){
    return;
  }

  const hasCandidate = hasPlus(self.candidatePluses, name);
  const cPlus = self.candidatePluses[name]
  if (value?.plusName){
    const {plusName} = value;
    if (hasCandidate){
      return;
    }
    self.candidatePluses[name] = {...value, status: 'unload'}
  } else if (value instanceof Promise) {
    if (!hasCandidate || cPlus?.status ==='unload'){
      self.taskPromises_.push(value)
      value.then((val) => {
        addPlus__(self, name, val)
        //nextPlus__.call(self, name, value);
      }).catch((e) => {
        throw e
      })
      self.candidatePluses[name] = {...value, status: 'loading'}
    } else {
      return;
    }
  } else {
    self.pluses[name] = value
    self.candidatePluses[name] = null
  }
}

function defautExistPlus__(controller) {
  const self = controller
  let plusName ;
  let needPluses = Object.keys(self.needPlusMap_)
  for (let i = 0; i < needPluses.length; i++) {
    plusName =  needPluses[i]
    if (!hasPlus(self.pluses, plusName) && !hasPlus(self.candidatePluses, plusName)){
      addPlus__(self, plusName, null)
    }
  }
}

async function compileCandidatePlus__(controller, needPlusNames){
  let self = controller
  let i = 0;
  for (; i < needPlusNames.length; i++) {
    const plusName = needPlusNames[i]
    const plus = self.candidatePluses[plusName]
    await addPlusOfAssemble__(self, plus)
  }
}

function needCandidatePlus__(controller){
  let self = controller
  let plusNames = Object.keys(self.candidatePluses)
  let i = 0;
  let needPlusNames = []
  for (; i < plusNames.length; i++) {
    const plusName = plusNames[i]
    const plus = self.candidatePluses[plusName]
    if (plus?.plusName){
      needPlusNames.push(plusName)
    }
  }
  return needPlusNames;
}

async function compilePlus__(controller) {
  let self = controller
  await Promise.all(self.plusPromises_);
  await Promise.all(self.taskPromises_);
  defautExistPlus__(controller)
  let retryMax = 10
  let needPlusNames;
  while (retryMax > 0) {
    self.taskPromises_ = []
    const needPlusNames = needCandidatePlus__(self);
    await compileCandidatePlus__(self, needPlusNames)
    await Promise.all(self.taskPromises_);
    retryMax--
    if (needPlusNames.length <=0){
      break;
    }
  }
  needPlusNames = needCandidatePlus__(self)
  const log = self.getPlus('log')()
  if (needPlusNames.length >= 1) {
    log.warn(`[mauk]Circular dependency injection failed,pluses is: ${needPlusNames.join()}`)
    throw new Error(`[mauk]Circular dependency injection failed,pluses is: ${needPlusNames.join()}`)
  }
}

async function includeUsing(controller, fullFile,referenceFile){
  const self = controller
  let fnMap = {}
  async function includeOne(fullFileOne){
    const fns = await includeModule(self, fullFileOne, referenceFile)
    if (Array.isArray(fns)){
      fns.forEach(function (item){
        if (item.name){
          fnMap[item.name] = item;
        }
      })
    } else if (Object.prototype.toString.call(fns) === '[object Object]') {
      Object.assign(fnMap, fns)
    }
  }

  if (Array.isArray(fullFile)){
    for(let i=0; i<fullFile.length ;i++){
      await  includeOne(fullFile[i])
    }
  } else {
    await  includeOne(fullFile)
  }
  return fnMap
}


function includeUsingChain (controller, referenceFile){
  const self = controller
  function UsingChain (){
    this.includeFiles = []
    this.referenceFile = referenceFile
  }
  UsingChain.prototype.add = function (fullFileOne){
    this.includeFiles.push(fullFileOne)
    return this;
  }

  UsingChain.prototype.build = async function ({isArray = false }={}) {
    if (!isArray) {
      return await includeUsing(self, this.includeFiles, this.referenceFile)
    } else {
      let fnAll = []
      for (let i = 0; i < this.includeFiles.length; i++) {
        const fns = await includeModule(self, this.includeFiles[i], this.referenceFile)
        fnAll.push(...fns)
      }
      return fnAll
    }
  }
  return  new UsingChain()
}

//  usingPlus.init = function (referenceFile){
//
//   }


exports=module.exports = {includePlus, addPlus__, compilePlus__, includeModule, includeUsing, includeUsingChain}