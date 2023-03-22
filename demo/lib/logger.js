const log4js = require('log4js')
let logConfig = require('../conf/logger')
let useFormat =  logConfig({domain:'normal'}).useFormat

const loggers = {
  normal: log4js.getLogger('normal')
}


function logfn(category,opt={use: false}) {
  let logger = null;
  category = category || 'normal'
  logger =  loggers[category]
  if (!logger){
    logger = log4js.getLogger(category)
    logger[category] = logger
  }
  if (opt.use){
    logger = log4js.connectLogger(logger, useFormat)
  }
  return logger;
}

logfn.init = function init({domain}){
  log4js.configure(logConfig({domain}))
}
logfn.getLogger = logfn
exports = module.exports =  logfn