var fs = require('fs');
var crypto = require('crypto');
//获取md5码
exports.getMD5 = function(filepath, size){
    if(fs.existsSync(filepath) && fs.statSync(filepath).isFile()){
        var fileContent = fs.readFileSync(filepath, 'utf-8');
        var md5 = crypto.createHash('md5');
        md5.update(fileContent);
        var hex = md5.digest('hex');
        return /^[0-9]+$/.test(size) ? hex.substring(0, size) : hex;
    }
}
