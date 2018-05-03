/**
 * Created by wangmin on 15/6/16.
 */

var path =require('path')

function full(filename){
    return path.resolve(__dirname,filename);
}

exports = module.exports = tuple('_',function(_){
    return [
        tuple(function unitandsimple(req,res){
            res.success({haha:'unitandsimple'})
        })

    ];
});
