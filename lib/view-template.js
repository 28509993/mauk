/**
 * Created by wangmin on 15/12/9.
 */

var fs = require('fs')
    ,path = require('path')
    ,hash=require('./hash')
    ,util=require('util')


var tplCache={};
function loadTpl(file) {
    var hashId =  hash(file);
    var str= tplCache[hashId];
    if (str) return  str;
    str= fs.readFileSync(file).toString();
    tplCache[hashId] = str;
    return str;
}


function convertView(fileName){
    var fileName = path.normalize(fileName);
    var str=loadTpl(fileName);
    var pattern = /<!--include:([^>\s]+.html)-->/gi;// <!--include:file.html-->
    var result ;
    while(result = pattern.exec(str)){
        str = str.replace(result[0],convertView (path.join( path.dirname(fileName),result[1])));
    }
    return str;
}

exports=module.exports=convertView;