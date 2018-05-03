var options = require('./setting.json')
    //, exec = require('child_process').exec

var app = require('./app/main.js')(options);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});


if (app.get('env') === 'development') {
    app.use(function(err,req,res,next){
        //console.log(err);
        //console.log(req.headers)
        res.status(err.status || 500);
        res.send(err.stack);
    })
}
app.use(function(err,req,res,next){
    res.status(err.status || 500);
    res.send(err.message);
})


var PORT = parseInt(process.env.PORT || 3001);
var server = app.listen(PORT, function () {
    console.log('Node app is running, port:', PORT);
});


var mySetTimeout_=function(times,cb){
    setTimeout(function(){console.log('timeouit!');cb(null,times+'kkk')},times);
}

/*
var thunkify =require('thunkify');
mySetTimeout_(1000,function(err,k){console.log(k)});
var co=require('co');
var mySetTimeout = thunkify(mySetTimeout_);
var k=co(function * () {
    var v1 = yield mySetTimeout(2000);
    console.log(v1);
    v1 = yield mySetTimeout(1000);
    console.log(v1);

});
var fs=require('fs');
var readFile =thunkify(fs.readFile);
co(function *(){
    var data= yield readFile(__filename);
    console.log(data);
} )

*/

