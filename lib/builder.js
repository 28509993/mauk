/**
 * Created by wangmin on 2018/7/5.
 */

const path = require('path')
const Controller =  require('./controller');
exports=module.exports=function({contextPath, domain, setting,logger, ...others}){
  const options = {contextPath: path.resolve(contextPath), domain, setting, ...others}
  const ctl = new Controller(options)
  ctl.addPlus('setting',setting)
  if (logger){
    ctl.addPlus('log',logger)
  }

  function build (){
    ctl.compile()
    return function handler(req,res,next){
      const router = ctl.buildRouter(req,res,next)
      if (!router) {
        next();
      }else {
        router.run().then(()=>{
        },(err)=>{
          next(err)
        })
      }
    }
  }
  function addPlus(plusFile,referenceFile){
    if (referenceFile){
      ctl.addPlus(path.resolve(referenceFile,plusFile))
    } else {
      ctl.addPlus(plusFile)
    }
    return this;
  }

  function addBean(beanClass){
    ctl.addBean(beanClass)
    return this;
  }

  function useSession(){
    let sessNextFn_ = null;
    let isFirst = true;
    return function (req, res, next) {
      if (isFirst){
        const useSessionHandler = ctl.getPlus('session')?.useSession
        if (useSessionHandler){
          sessNextFn_ = useSessionHandler()
        }
        isFirst = false;
      }
      if (sessNextFn_){
        sessNextFn_(req, res, next)
      } else {
        next()
      }
    }
  }

  function getPlus(name){
    return ctl.getPlus(name)
  }
  function close() {
     ctl.getPlus('emitter').emit('close')
  }
  async function  waitAll() {
    return  await  ctl.awaitAll()
  }
  return {build,addPlus,addBean,useSession,getPlus,waitAll,close}
}
