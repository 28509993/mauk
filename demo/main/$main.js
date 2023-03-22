/**
 * Created by wangmin on 2021/4/15.
 */
const path = require('path')
exports = module.exports = tuple('log!normal','using','context','utils',
  function main(log,using,context,utils) {

    return [
      tuple({auth: 0,rule:'index.html', domain: 'demo'},async function (r) {
        r.contentType = 'html'
        let filename = path.join( __dirname, '../conf/home.html')
        //support ejs template
        let result = await utils.demoFile(filename)
        this.result = result
      }),
      tuple({auth: 2,rule:'index2.html',redirect:'/login.html'},async function (r) {

        this.result = ''
      }),

      tuple({auth:0,rule:/hello.(html|pdf|json|xlsx|docx)/i}, async function (r) {
        this.result = ''
      })
    ];
  });
