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
      ctl.addPlus(path.resolve(plusFile))
    }
    return this;
  }
  function addPlusByName(name,value){
    ctl.addPlus(name,value)
    return this;
  }
  function addBean(beanClass){
    ctl.addBean(beanClass)
    return this;
  }

  function useSession(){
    return ctl.getPlus('session').useSession()
  }

  function getPlus(name){
    return ctl.getPlus(name)
  }

  function  start(fn) {
    let t =  setInterval(function startServer() {
      if (ctl.ready){
        clearInterval(t);
        fn();
      }
    },10)
  }
  function close() {
     ctl.getPlus('emitter').emit('close')
  }
  return {build,addPlus,addBean,useSession,getPlus,start,close}
}