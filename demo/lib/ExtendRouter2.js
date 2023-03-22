

const Router = require('../../index').Router
const {Readable} = require('stream');
const mime = require('mime-types')

function createExtendRouterClass({logger,defaultRouter}={logger: console,defaultRouter: true}) {
  class ExtendRouter2 extends Router {
    constructor(...args) {
      super(...args);
      this.allowed = false;
      this._end_ = false
      this.log = logger
      this.contentType = 'json'
    }

    set redirect(url) {
      this._redirect = url
    }

    get domain() {
      return  this.getPlus('setting').domain
    }

    get session() {
      //you do it
      return  {}
    }



    async checkAllow() {
      let auth = this.acl.auth
      if (auth == undefined) {
        auth = 1;
      }
      if (!auth) {
        this.allowed = true
        return
      }
      this.allowed = true
      //session.authorized
    }

    async doRun() {
      this.parseContentType()
      //here is ,authorized redirect .....
      if (this.method == 'POST') {
        await this.waitPostData()
      }
      this.log.info(`[ExtendRouter] url=${this.path} query=${JSON.stringify(this.query||{})}`)
      await this.checkAllow()
      await this.callFn()
    }


    async run() {
      try {
        await this.doRun()
        this.success()
      } catch (e) {
        this.log.error(`[ExtendRouter]`, e)
        this.fail(e)
      }
    }

    success() {
      if (this._end_) {
        return
      }
      this._end_ = true;
      this.fillContentType()
      if (this.result instanceof Readable) {
        this.result.pipe(this.res)
      } else if (this.contentType === 'json') {
        const val = {errcode: 0, data: this.result || {}, traceId: this.traceId}
        this.res.json(val || {})
      } else if (this.result) {
        this.res.send(this.result || '')
      } else {
        this.res.end();
      }
    }
    fillContentType(opts) {
      let contentType  = 'text/pain;charset=utf-8';
      if (mime.lookup(this.contentType) ){
        contentType = mime.contentType(this.contentType)
      }
      this.res.set('Content-Type',contentType)
    }

    fail(e) {
      if (this._end_) {
        return
      }
      this._end_ = true;
      this.res.status(500);
      this.res.send({error: 'has a error'})
    }

  }
  return ExtendRouter2;
}


exports=module.exports=createExtendRouterClass
