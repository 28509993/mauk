/**
 * Created by wangmin on 15/7/3.
 */

const logfn=function(...args){
    return logfn;
}

logfn.log =console.log
logfn.warn =console.warn
logfn.error =console.error
logfn.info =console.info
logfn.debug =console.debug
exports = module.exports =logfn
