/**
 * Created by wangmin on 2018/7/5.
 */
class Router {
  constructor(pathname, doFn, controller, acl, req, res, next) {
    this.controller = controller;
    this.pathname = pathname;
    this.acl = acl;
    this.req = req;
    this.res = res;
    this.next = next;
    this.result = null
    this.rawBody = null
    this.doFn = doFn
    this.contentType = 'json'
  }

  get query() {
    return this.req.query || {}
  }

  get headers() {
    return this.req.headers || {}
  }

  get url() {
    return this.req.url;
  }
  get path() {
    return this.pathname;
  }
  get method() {
    return this.req.method;
  }

  getPlus(name, para) {
    return this.controller.getPlus(name, para)
  }

  async preRun() {
    //授权处理，返回true表示已处理，后续不用处理
    //比如一些跳转操作
    return false
  }

  async callFn() {
    await this.doFn.call(this,this)
  }

  async run() {
    await this.callFn()
    const res = this.res
    if (this.contentType === 'json') {
      const val = {errcode: 0, data: this.result}
      res.set('Content-Type', 'application/json;charset=utf-8')
      res.json(val || {})
    } else if (this.contentType === 'html') {
      res.set('Content-Type', 'text/html;charset=utf-8')
      res.send(this.result)
    }
  }
}

exports=module.exports=Router
