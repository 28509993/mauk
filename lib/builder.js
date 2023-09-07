/**
 * Created by wangmin on 2018/7/5.
 */

const path = require('path')
const Controller =  require('./controller');
exports=module.exports=function({contextPath, domain, setting,logger}){
  const options = {contextPath: path.resolve(contextPath), domain, setting}
  const ctl = new Controller(options)
  ctl.addPlus('setting',setting)
  ctl.addPlus('log',logger)
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
    let sessNext_ = null;
    return function (req, res, next) {
      if (!sessNext_){
        sessNext_ = ctl.getPlus('session').useSession()
      }
      return sessNext_(req, res, next)
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
