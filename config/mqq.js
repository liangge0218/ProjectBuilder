module.exports = {
    //源码目录
    'root' : '/fund_trunk/htdocs',
    //临时目录
    'temp' : './temp',
    //构建目录
    'dest' : '/fund_trunk/dest',
    //需要构建的js列表
    'js' : [
        {
            'source' : '/weixin/v4/js/page/*/*.js',
            'concat' : ''
        }
        // ,
        // {
        //     'source' : '/weixin/v4/js/mod/*.js',
        //     'concat' : 'mod.js'
        // }
    ]

}
