/**
 * Created by wangmin on 15/6/19.
 */


var logger = require('./logger')

exports=module.exports=function(fullFile){
    var defines= typeof fullFile === 'string' ? require(fullFile):fullFile; //tuple
    var pn=defines.length;
    if (pn<=0 || typeof (defines[pn-1] )!=='function') return ;
    var fn = defines[pn-1] ;
    var vars=fn.toString().match(/\(([^|()]*)\)/);
    vars = !vars?[]:vars[1].replace(/\s/,'').split(',');
    return function(app){
        var args=[];
        var argsMap={}
        for (var i= 0,n=pn- 2;i<=n;i++){
            var varName=defines[i];
            //var varFn=  (/^(log)(|!([\s\S]*))$/).exec(varName);
            var varFn=  (/^([^!]+)(!([\s\S]*))$/i).exec(varName);
            var varValue=app.extend[varName];
            if (varFn){
                var func=app.extend[varFn[1]];
                if (varFn[1]==='log'){
                    varValue= typeof(func)==='function'? func(varFn[3]):logger();
                }else{
                    varValue= typeof(func)==='function'? func(varFn[3]):func;
                }
            }
            args.push(varValue);
            vars[i] && (argsMap[vars[i]]=varValue);
        }
        var fnRoutes= fn.apply(app,args);
        if (Object.prototype.toString.call(fnRoutes)==='[object Function]'){


        }else if (Object.prototype.toString.call(fnRoutes)==='[object Array]'){
            fnRoutes.forEach(function(fnTuple){
                fnTuple=fnTuple[1]||fnTuple[0]||fnTuple;
                fnTuple.modules=argsMap;
            })
        }
        return fnRoutes;
    };
}
