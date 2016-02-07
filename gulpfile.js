var q = require('q');
var fs = require('fs');
var path = require('path');
var del = require('del');
var crypto = require('crypto');
var gulp = require('gulp');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var replace = require('gulp-replace');
var runSequence = require('run-sequence');

var util = require('./util/util');

var weixinConfig = require('./config/weixin');
var mqqConfig = require('./config/mqq')
var useConfig = weixinConfig;
//初始化
process.argv.forEach(function(param){
    if(param === '--Pweixin'){
        useConfig = weixinConfig;
    }
    else if(param === '--Pmqq'){
        useConfig = mqqConfig;
    }
})
// if(!useConfig){
//     throw new Error('请指定要构建的平台，例如: mqq、weixin');
// }

//任务入口
gulp.task('default', function(){
    runSequence('build-clean', 'build-js', 'build-file', 'build-css', 'build-html', function(){
        console.log('over!');
    });
})

gulp.task('build-clean', function(){
    console.log('delete folder : ' + useConfig.temp);
    del.sync(useConfig.temp, {force:true});
    // gulp.src(useConfig.temp, {read:false}).pipe(rimraf({force:true}));
})

gulp.task('build-js', function(){
    useConfig.js.forEach(function(jsObj){
        console.log('build js ' + useConfig.root + jsObj.source);
        var stream = gulp.src(jsObj.source, {cwd:useConfig.root,base:useConfig.root});
        if(jsObj.concat){
            stream = stream.pipe(concat(jsObj.concat));
        }
        stream = stream.pipe(rename({suffix:'.min'}));
        stream = stream.pipe(uglify());

        stream = stream.pipe(gulp.dest(useConfig.temp));
    })
})

gulp.task('build-file', function(){
    useConfig.files.forEach(function(filesObj){
        console.log('build files ' + useConfig.root + filesObj.source);
        gulp.src(filesObj.source, {cwd:useConfig.root,base:useConfig.root})
            .pipe(gulp.dest(useConfig.temp));
    })
})

gulp.task('build-css', function(){
    useConfig.css.forEach(function(cssObj){
        console.log('build css ' + useConfig.root + cssObj.source);
        var stream = gulp.src(cssObj.source, {cwd:useConfig.root,base:useConfig.root})
            .pipe(cssnano())
            //url()格式带md5
            // .pipe(replace(/url\(([^\)]+)\?(\{md5\}).*?\)/g, function(m, p1, p2){
            //     var filepath = path.join(useConfig.root, p1);
            //     var hex = util.getMD5(filepath, useConfig.masksize);
            //     return hex ? m.replace(p2, hex) : m;
            // }));
        stream = stream.pipe(gulp.dest(useConfig.temp));
    })
})

gulp.task('build-html', function(){
    useConfig.html.forEach(function(htmlObj){
        console.log('build html ' + useConfig.root + htmlObj.source);
        gulp.src(htmlObj.source, {cwd:useConfig.root,base:useConfig.root})
            //<link rel="stylesheet" type="text/css" href="">
            .pipe(replace(/\<link\s*[^\>]*?href=['"]([^'"]+)['"][^\>]*?[\/]?\>/gi, function(m, p1){

            }))
            .pipe(gulp.dest(useConfig.temp));
    })
})
