exports = module.exports = tuple('log!normal',function context(log) {
  const ctl = this;
  let settingDefault = ctl.options.setting.default || {}
  let rootCom = settingDefault.rootCom || '605f603834af7937d29abc0c';
  let rootUser = settingDefault.rootUser || '605f603834af7937d19bbb0c';
  let needCached = true
  class Context {
    constructor() {
    }
    get rootCom() {
      return rootCom
    }
    get needCached() {
      return needCached
    }
    defaultComs(r){
      return [r.currentCom,rootCom]._unique()
    }
    get domain() {
      return ctl.domain
    }
    get contextPath() {
      return ctl.contextPath
    }
    get setting() {
      return ctl.options.setting
    }
  }
  return new Context();
});
