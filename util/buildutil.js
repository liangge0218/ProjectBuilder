var q = require('q');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var cache = require('./cache');

//以url路径中 最后一级文件夹/文件名 为key
var _getUrlKey = exports.getUrlKey = function(url){
    return url.replace(/\\/g, '/').replace(/(?:.*\/)?(.*\/[^\?#]*).*/, '$1');
}

//获取构建压缩后文件名的url
var _getSuffixUrl = function(url, suffix){
    var dirname = path.dirname(url);
    var extname = path.extname(url);
    var basename = path.basename(url, extname);
    return path.join(dirname, basename + suffix + extname).replace(/\\/g, '/');
}

//获取文件流md5
exports.getContentsMD5 = function(contents){
    var md5 = crypto.createHash('md5');
    md5.update(contents);
    var hex = md5.digest('hex');
    return hex.substring(0, global.useConfig.masksize);
}

//css内容构建，加cdn，替换md5
//url(xxx)格式
exports.getBuildCssContents = function(contents){
    return contents.replace(/url\(([^\)]+)\)/g, function(m, url){
        var newUrl = url;
        newUrl = newUrl.replace(/^\/weixin\//, '//qian-img.tenpay.com/weixin/');

        var urlmd5 = cache.getCache( _getUrlKey(newUrl) );
        if(urlmd5){
            newUrl = newUrl.replace(/\{md5\}/, urlmd5);
        }
        return m.replace(url, newUrl);
    })
}

//html内容构建
//<link rel="stylesheet" type="text/css" href="">格式
//<script src="">格式
//<img src="">格式
//__pkg("")格式   外链
exports.getBuildHtmlContents = function(contents){
    return contents.replace(/\<link\s*[^\>]*?href=['"]([^'"]+)['"][^\>]*?[\/]?\>/gi, function(m, url){
        var newUrl = url;
        newUrl = newUrl.replace(/^\/weixin\//, '//qian-img.tenpay.com/weixin/');

        var urlmd5 = cache.getCache( _getUrlKey(newUrl) );
        if(urlmd5){
            newUrl = newUrl.replace(/\{md5\}/, urlmd5);
        }
        return m.replace(url, newUrl);
    })
    .replace(/\<script\s*[^\>]*?src=['"]([^'"]+)['"][^\>]*?[\/]?\>/gi, function(m, url){
        var newUrl = url;
        newUrl = newUrl.replace(/^\/weixin\//, '//qian-img.tenpay.com/weixin/');
        //获取带压缩后文件名的url
        newUrl = _getSuffixUrl(newUrl, global.useConfig.jssuffix);
        var urlmd5 = cache.getCache( _getUrlKey(newUrl) );
        if(urlmd5){
            newUrl = newUrl.replace(/\{md5\}/, urlmd5);
        }
        return m.replace(url, newUrl);
    })
    .replace(/\<img\s*[^\>]*?src=['"]([^'"]+)['"][^\>]*?[\/]?\>/gi, function(m, url){
        var newUrl = url;
        newUrl = newUrl.replace(/^\/weixin\//, '//qian-img.tenpay.com/weixin/');

        var urlmd5 = cache.getCache( _getUrlKey(newUrl) );
        if(urlmd5){
            newUrl = newUrl.replace(/\{md5\}/, urlmd5);
        }
        return m.replace(url, newUrl);
    })
    .replace(/__pkg\(['"]([^'"]+)['"]\)/gi, function(m, url){
        var newUrl = url;
        newUrl = _getSuffixUrl(newUrl, global.useConfig.jssuffix);
        var urlmd5 = cache.getCache( _getUrlKey(newUrl) );
        if(urlmd5){
            newUrl = newUrl.replace(/\{md5\}/, urlmd5);
        }
        return m.replace(url, newUrl);
    })
}
