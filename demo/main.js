const express = require('express')
  // , logger = require('./lib/logger')
  , createLog = require('./lib/logger')
  ,http = require('http')
  ,mauk = require('../index')


let setting = require('./conf/demo.json')
const {raw} = require("express");
const logger = createLog({domain:setting.domain})
const log = logger.getLog()
log.info(`[server]${process.argv}`)
log.info(`[server] start domain is ${setting.domain}`)

function main(setting){
  const log = logger.getLog()
  let builder = mauk({contextPath:'main',domain:setting.domain,setting,logger: logger.plusLog()})
  builder = require('./plus')(builder,{logger:log});
  function notFound (req,res,next) {
    log.warn(`[main] not found! url=${req.originalUrl}`)
    res.status(404);
    if (/html/i.test(req.headers['accept'])) {
      res.send("not found!");
    }
  }

  function setError (err,req,res,next) {
    log.error(`[main] http error,status= ${err.message}, url=${req.originalUrl}`)
    res.status(err.status || 500);
    res.send(err.message);
  }

  let app = express()
  app.use(logger.useLog())
    //    .use (timeout('5s'))
    //    .use(express.json())
    //    .use(express.urlencoded({ extended: false }))
    // .use(cookieParser())
    .use(builder.build())
    .use(notFound)
    .use(setError)
  let port = setting.port
  let server = http.createServer(app);

  app.close = function(fn){
    builder.close()
    server.close(()=>{
      fn()
    })
  }

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    let bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        log.error( `[main] ${bind} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        log.error( `[main]  ${bind} is already in use`);
        process.exit(1);
        break;
      default:
        process.exit(1);
    }
  }

  function onListening (){
    let addr = server.address();
    let bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    log.info('[main]Listening on ' + bind);
  }
  function startServer() {
    server.listen(port, onListening);
    server.on('error', onError);
  }
  (
    async () =>{
      await builder.waitAll();
      startServer()
    }
  )();
}




log.info("[server]start .......");
main(setting);

