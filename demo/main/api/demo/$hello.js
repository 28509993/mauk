/**
 * Created by wangmin on 18/7/16.
 */
exports = module.exports = tuple('log!normal','utils','using','redis!0',function hello(log,utils,using,redis) {
  const {useFunction} = using.init(__dirname)
              .add('./separate-demo.js')
              .build();
  return [
    tuple({auth: 0, rule:'hello', name:'hello'}, async function (r) {
      let result = await useFunction(r)
      r.result = {hello:'hello world', ...result}
    }),
    tuple({auth: 0, rule:'hello1', name:'hello'},async function (r) {
      r.result = {hello:'hello world'}
    }),
    tuple({auth:1, rule:'post'}, async function (r) {
      r.result = r.query
    })
  ];
});





