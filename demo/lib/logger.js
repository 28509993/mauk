const log4js = require('log4js')
let logConfig = require('../conf/logger')

class LogFactory{
  constructor(logConfig) {
    this.loggers = {}
    this.logConfig = logConfig
    this.useFormat =  logConfig.useFormat
  }
  getLog (category = 'normal'){
    let  logger =  this.loggers[category]
    if (!logger){
      log4js.configure(this.logConfig)
      logger = log4js.getLogger(category)
      this.loggers[category] = logger
    }
    return logger;
  }

  logUse (category = 'normal'){
    let logger = this.getLog(category)
    return log4js.connectLogger(logger, this.useFormat)
  }

  logPlus (){
    const self = this
    return function log (category){
      return self.getLog(category)
    }
  }
}

let logFactory = null;
function createLog ({domain}){
  if (logFactory){
    return logFactory
  }
  logFactory = new LogFactory(logConfig({domain}))
  return logFactory;
}

exports = module.exports =  createLog;


