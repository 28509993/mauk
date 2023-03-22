
exports = module.exports = function logConfig({domain}) {
  return {
    appenders: {
      console: {type: "console"},
      normalLogs: {type: "file", "filename": `log/normal-${domain}.log`},
      errorFile: {type: "file", "filename": `log/error-${domain}.log`},
      errors: {type: "logLevelFilter", level: "error", appender: "errorFile"}
    },
    categories: {
      normal: {appenders: ["normalLogs", "errors",'console'], level: "info","enableCallStack": true},
      default: {appenders: ["console"], level: "info"}
    },
    useFormat: {level: 'info', format: '[HTTP] :remote-addr :method :url :status :response-timems :referrer HTTP/:http-version :user-agent '},
    aaa: "error info trace debug all",
    // pm2: true,
    // pm2InstanceVar: 'INSTANCE_ID',
    disableClustering: true
  }
}

