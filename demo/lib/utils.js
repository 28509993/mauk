

const fs = require('fs')





function demoFile(filename){
  return new Promise((resolve,reject)=>{
    fs.readFile(filename,"utf-8",function(err, data) {
      if (err){
        return reject(err)
      }
      resolve(data);
    });
  })
}





let exportObjs = {
  demoFile
}


exports = module.exports = exportObjs
