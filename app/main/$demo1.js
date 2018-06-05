/**
 * Created by wangmin on 15/6/16.
 */

var path = require('path')

function full(filename) {
  return path.resolve(__dirname, filename);
}

/*
 var thunkify =require('thunkify');
 var fs=require('fs');
 var co=require('co');
 var mySetTimeout_=function(times,cb){
 setTimeout(function(){console.log('timeouit!');cb(null,times+'kkk')},times);
 }
 mySetTimeout_(1000,function(err,k){console.log(k)});
 var mySetTimeout = thunkify(mySetTimeout_);
 function *Foo(times,cb){
 //setTimeout(function(){console.log('timeouit!');cb(null,times+'kkk')},times);
 }

 co(function * () {
 var v1 = yield mySetTimeout(2000);
 console.log(v1);
 v1 = yield mySetTimeout(1000);
 console.log(v1);
 var vi = yield Foo ();
 console.log(vi)
 return 'complete';
 }).then(function (val) {
 console.log(val);
 }, function (err) {
 console.error(err.stack);
 });

 //https://cnodejs.org/topic/4f16442ccae1f4aa2700106d

 var readFile =thunkify(fs.readFile);
 co(function *(){
 var data= yield readFile(__filename);
 //console.log(data);
 } )*/


exports = module.exports = tuple('log!access', '_', function (log, _) {
  return [
    function notuple(req, res) {
      res.success({haha: 'notuple'})
    },
    tuple(function simple(req, res) {
      //this is {app:app,req:req,res:res,log:log,_:_......}
      log.error('log.error(str)');
      log.info('log.info(str)');
      log.warn('log.warn(str)');
      // var mySetTimeout = thunkify(mySetTimeout_);
      // co(function * () {
      //     var v1 = yield mySetTimeout(2000);
      //     console.log(v1);
      //     v1 = yield mySetTimeout(1000);
      //     console.log(v1);
      //     vi=yield {};
      //     console.log(vi)
      //     res.success({haha:'simple'})
      //     return 'complete';
      // }).then(function (val) {
      //     console.log(val);
      // }, function (err) {
      //     console.error(err.stack);
      // });
      res.json({simple: 'simple'})
    }),
    tuple('noname', function (req, res, next) {
      res.json({a: 'noname'})
    }),
    tuple(/rule/i, function (req, res, next) {
      res.success({haha: 'rule'})
    }),

    tuple({noAuth: true, domain:'api', options: {dd:1}}, function hello(req, res, next) {
      res.success({haha: 'hello!'})
    }),

    tuple({rule: 'article', method: 'GET', view: full('demo1.ejs'), noAuth: true}, function (req, res, next) {
      res.render2({currentTime: 678});
      //res.json({a:2})
    }),
    tuple({rule: /say/i, method: 'GET', noAuth: true}, function (req, res, next) {
      res.success({haha: 'ok'})
    }),
    tuple({rule: 'doFail', method: 'GET', noAuth: true}, function (req, res, next) {
      res.fail({haha: 'err'})
    })
  ];
});





