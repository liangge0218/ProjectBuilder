var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
//获取md5码
var _getMD5 = function(filepath, size){
    if(fs.existsSync(filepath) && fs.statSync(filepath).isFile()){
        var fileContent = fs.readFileSync(filepath, 'utf-8');
        var md5 = crypto.createHash('md5');
        md5.update(fileContent);
        var hex = md5.digest('hex');
        return /^[0-9]+$/.test(size) ? hex.substring(0, size) : hex;
    }
}

//替换MD5码
exports.addMD5 = function(url, useConfig){
    var md5reg = /\{md5\}/;
    if(md5reg.test(url)){
        var filepath = path.join(useConfig.root, url.replace(/\?.*/, ''));
        var hex = _getMD5(filepath, useConfig.masksize);
        return hex ? url.replace(md5reg, hex) : url;
    }
    return url;
}

//加上CDN域名前缀
exports.addCDNdomain = function(url){
    return url.replace(/^\/weixin\//, '//qian-img.tenpay.com/weixin/');
}
