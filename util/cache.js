var fs = require('fs');
var cacheStorage = {};
var cacheFileName = './cache.json';
exports.setCache = function(key, value){
    cacheStorage[key] = value;
}

exports.getCache = function(key){
    return key ? cacheStorage[key] : cacheStorage;
}

exports.persistence = function(){
    var json = JSON.stringify(cacheStorage);
    fs.writeFileSync(cacheFileName, json, 'utf-8');
}
