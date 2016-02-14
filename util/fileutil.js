var q = require('q');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

// //深度读取目录
// var readDirDeep = exports.readDirDeep = function(filepath, callback){
//     q.fcall(function(){  //判断文件夹是否存在
//         var df = q.defer();
//         fs.exists(filepath, function(exists){
//             if(exists){
//                 df.resolve();
//             }else{
//                 throw new Error('文件夹不存在：' + filepath);
//             }
//         })
//         return df.promise;
//     })
//     .then(function(){   //文件夹遍历
//         var df = q.defer();
//         fs.readdir(filepath, function(err, files){
//             if(err){
//                 throw err;
//             }
//             if(files.length == 0){
//                 return;
//             }
//             df.resolve(files);
//         })
//         return df.promise;
//     })
//     .then(function(files){   //判断是文件还是文件夹
//         var df = q.defer();
//         files.forEach(function(file, index){
//             var subfilepath = path.join(filepath, file);
//             fs.stat(subfilepath, function(err, f){
//                 if(err){
//                     throw err;
//                 }
//                 if(f.isDirectory()){
//                     readDirDeep(subfilepath, callback);
//                 }else{
//                     callback(subfilepath.replace(/\\/g, '/'));
//                 }
//             })
//         })
//         return df.promise;
//     })
//     .done();
// }

//对比文件md5
exports.compareFileMD5 = function(tempPath, destPath, callback){
    q.fcall(function(){ //判断源文件是否存在
        var df = q.defer();
        fs.exists(tempPath, function(exists){
            if(exists){
                df.resolve();
            }else{
                throw new Error('对比MD5源文件不存在：' + tempPath);
            }
        })
        return df.promise;
    })
    .then(function(){   //判断目标文件是否存在
        var df = q.defer();
        fs.exists(destPath, function(exists){
            if(exists){
                df.resolve();
            }else{  //目标文件不存在，返回MD5不一致
                callback(false);
            }
        })
        return df.promise;
    })
    .then(function(){   //读源文件md5
        var df = q.defer();
        var md5 = crypto.createHash('md5');
        fs.createReadStream(tempPath)
            .on('data', function(chunk){
                md5.update(chunk);
            })
            .on('end', function(){
                var tempMD5 = md5.digest('hex');
                df.resolve(tempMD5);

            })
        return df.promise;
    })
    .then(function(tempMD5){   //读目标文件md5
        var df = q.defer();
        var md5 = crypto.createHash('md5');
        fs.createReadStream(destPath)
            .on('data', function(chunk){
                md5.update(chunk);
            })
            .on('end', function(){
                var destMD5 = md5.digest('hex');
                callback(tempMD5 == destMD5);
            })
        return df.promise;
    })
    .done();
}
