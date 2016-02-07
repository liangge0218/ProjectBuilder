module.exports = {
    //源码目录
    'root' : '/fund_trunk/htdocs',
    //临时目录
    'temp' : '/temp/htdocs',
    //构建目录
    'dest' : '/fund_trunk/dest/htdocs',
    //文件打码长度
    'masksize' : 10,
    //需要构建的js列表
    'js' : [
        {
            'source' : ['weixin/lib/ping_tcss_https.3.1.0.js', 'weixin/lib/sea.js', 'weixin/lib/zepto.js', 'weixin/lib/config4.js'],
            'concat' : 'weixin/lib/lib.js'
        },
        {
            'source' : 'weixin/v4/js/page/**/*.js'
        },
        {
            'source' : 'weixin/v4/js/widget/*.js'
        },
        {
            'source' : 'weixin/v4/js/mod/*.js',
            'concat' : 'weixin/v4/js/mod/mod.js'
        },
        {
            'source' : 'weixin/v4/js/server/*.js',
            'concat' : 'weixin/v4/js/server/server.js'
        }
    ],
    'css' : [
        {
            'source' : 'weixin/v4/css/**/*.css',
            'match' : /url\(\/weixin\//g,
            'target' : 'url(//qian-img.tenpay.com/weixin/'
        }
    ],
    'files' : [
        {
            'source' : 'weixin/v4/img/**/*'
        },
        {
            'source' : 'weixin/inc/*'
        },
        {
            'source' : 'weixin/part/**/*'
        }
    ],
    'html' : [
        {
            'source' : 'weixin/v4/**/**/*.shtml'
        }
    ]

}
