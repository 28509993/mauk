

exports = module.exports = tuple('log!normal', function session(log) {
  function Session (req,res){
  }
  function useSession() {
    return function (req, res, next) {
      let session =  new Session(req, res);
      log.info(`[session] use the session!`)
      next();
    }
  }
  return {useSession}
});
