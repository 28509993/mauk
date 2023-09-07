/**
 * Created by wangmin on 18/7/16.
 */
exports = module.exports = tuple('log!normal','utils','using','redis!0',function hello(log,utils,using,redis) {
  //const {useFunction} = using(['./separate-demo.js'],__dirname);
  return [
    tuple({auth: 0, rule:'hello'}, async function (r) {
      let result = await useFunction(r)
      log.info('[hello]ddfdfd')
      r.result = {hello:'hello world', ...result}
    }),
    tuple({auth: 0, rule:'hello1'},async function (r) {
      r.result = {hello:'hello world'}
    }),
    tuple({auth:1, rule:'post'}, async function (r) {
      r.result = r.query
    })
  ];
});





