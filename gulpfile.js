var q = require('q');
var fs = require('fs');
var path = require('path');
var del = require('del');
var crypto = require('crypto');
var gulp = require('gulp');
var through2 = require('through2');
var ndir = require('ndir');
var targz = require('node-tar.gz');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var gulputil = require('gulp-util');
var runSequence = require('run-sequence');

var buildutil = require('./util/buildutil');
var fileutil = require('./util/fileutil');
var cache = require('./util/cache');

var weixinConfig = require('./config/weixin');
var mqqConfig = require('./config/mqq')
var useConfig = global.useConfig = weixinConfig;
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
    runSequence('build-clean', 'build-js', 'build-file', 'build-css', 'build-html','build-compare', function(){
        gulputil.log(gulputil.colors.yellow('cache persistenced!'));
        cache.persistence();
    });

    // gulp.start('build-compare');
})

gulp.task('build-clean', function(){
    var defer = q.defer();
    gulputil.log(gulputil.colors.green('delete folder : ' + useConfig.temp))
    del.sync(useConfig.temp, {force:true});

    defer.resolve();
    return defer;
})

gulp.task('build-js', function(){
    var defer = q.defer();
    var buildlen = useConfig.js.length;

    useConfig.js.forEach(function(jsObj){
        var stream = gulp.src(jsObj.source, {cwd:useConfig.root,base:useConfig.root});
        if(jsObj.concat){
            stream = stream.pipe(concat(jsObj.concat))
                        .pipe(gulp.dest(useConfig.temp));
        }
        stream = stream.pipe(rename({suffix:useConfig.jssuffix}))
                    .pipe(uglify())
                    .pipe(through2.obj(function(file, enc, callback){
                        var contents = file.contents.toString();
                        var md5 = buildutil.getContentsMD5(contents);
                        cache.setCache(buildutil.getUrlKey(file.path), md5);

                        this.push(file);
                        callback();
                    }))
                    .pipe(gulp.dest(useConfig.temp))
                    .on('end', function(){
                        if(--buildlen == 0){
                            defer.resolve();
                        }
                    })
    })
    return defer.promise;
})

gulp.task('build-file', function(){
    var defer = q.defer();
    var buildlen = useConfig.files.length;

    useConfig.files.forEach(function(filesObj){
        gulp.src(filesObj.source, {cwd:useConfig.root,base:useConfig.root})
            .pipe(through2.obj(function(file, enc, callback){
                var contents = (file.contents || '').toString();
                //防止文件夹
                if(contents){
                    var md5 = buildutil.getContentsMD5(contents);
                    cache.setCache(buildutil.getUrlKey(file.path), md5);
                }
                this.push(file);
                callback();
            }))
            .pipe(gulp.dest(useConfig.temp))
            .on('end', function(){
                if(--buildlen == 0){
                    defer.resolve();
                }
            })
    })
    return defer.promise;
})

gulp.task('build-css', function(){
    var defer = q.defer();
    var buildlen = useConfig.css.length;

    useConfig.css.forEach(function(cssObj){
        var stream = gulp.src(cssObj.source, {cwd:useConfig.root,base:useConfig.root})
            .pipe(cssnano())
            .pipe(through2.obj(function(file, enc, callback){
                var contents = file.contents.toString();
                //缓存md5
                var cssmd5 = buildutil.getContentsMD5(contents);
                cache.setCache(buildutil.getUrlKey(file.path), cssmd5);

                contents = buildutil.getBuildCssContents(contents);

                file.contents = new Buffer(contents);
                this.push(file);
                callback();
            }))
        stream = stream.pipe(gulp.dest(useConfig.temp))
                    .on('end', function(){
                        if(--buildlen == 0){
                            defer.resolve();
                        }
                    })
    })
    return defer.promise;
})

gulp.task('build-html', function(){
    var defer = q.defer();
    var buildlen = useConfig.html.length;

    useConfig.html.forEach(function(htmlObj){
        gulp.src(htmlObj.source, {cwd:useConfig.root,base:useConfig.root})
            .pipe(through2.obj(function(file, enc, callback){
                var contents = file.contents.toString();

                contents = buildutil.getBuildHtmlContents(contents);

                file.contents = new Buffer(contents);
                this.push(file);
                callback();
            }))
            .pipe(gulp.dest(useConfig.temp))
            .on('end', function(){
                if(--buildlen == 0){
                    defer.resolve();
                }
            })
    })
    return defer.promise;
})



gulp.task('build-compare', function(){
    var defer = q.defer();
    q.fcall(function(){      //读临时构建文件列表
        var df = q.defer();
        var tempfiles = [];
        ndir.walk(useConfig.temp, function onDir(dirpath, files){
            files.forEach(function(file, index){
                var filepath = file[0];
                var filestat = file[1];
                if(filestat.isFile()){
                    tempfiles.push(filepath);
                }
            })
        }, function onEnd(){
            if(tempfiles.length > 0){
                gulputil.log(gulputil.colors.green('临时构建文件读取完成'));
                df.resolve(tempfiles);
            }else{
                throw new Error('临时构建目录无文件');
            }
        }, function onError(){
        })

        return df.promise;
    })
    .then(function(tempfiles){      //跟构建目录对比出增量文件包
        var df = q.defer();
        var risefiles = [];
        var tempBase = path.resolve(useConfig.temp);
        var destBase = path.resolve(useConfig.dest);
        process.nextTick(function compareMD5(){
            var tempPath = tempfiles.shift();
            if(!tempPath){
                gulputil.log(gulputil.colors.green('增量文件对比完成'));
                if(risefiles.length == 0){
                    gulputil.log(gulputil.colors.red('本次没有要更新的文件'));
                    return;
                }
                return df.resolve(risefiles);
            }
            var destPath = tempPath.replace(tempBase, destBase);

            fileutil.compareFileMD5(tempPath, destPath, function(isMD5Same){
                if(!isMD5Same){
                    risefiles.push(tempPath);
                }
                compareMD5();
            })
        })
        return df.promise;
    })
    .then(function(risefiles){  //将增量文件列表提取到增量目录
        var df = q.defer();
        var tempBase = path.resolve(useConfig.temp);
        var riseBase = path.resolve(useConfig.rise);
        var files = risefiles.slice(0); //复制数组
        //先将增量目录删除
        del.sync(useConfig.rise, {force:true});

        process.nextTick(function copy(){
            var tempPath = files.shift();
            if(!tempPath){
                gulputil.log(gulputil.colors.green('增量文件提取完成'));
                return df.resolve(risefiles);
            }
            var risePath = tempPath.replace(tempBase, riseBase);
            ndir.copyfile(tempPath, risePath, function(err){
                if(err){
                    throw err;
                }
                copy();
            });
        });
        return df.promise;
    })
    .then(function(risefiles){   //增量目录打tar包
        var df = q.defer();
        var targzPath = path.join(path.dirname(useConfig.rise), 'htdocs.tar.gz');
        var stream = targz().createReadStream(useConfig.rise)
            .pipe(fs.createWriteStream(targzPath))
            .on('finish', function(){
                gulputil.log(gulputil.colors.green('增量文件打tar包完成'));
                df.resolve(risefiles);
            })
        return df.promise;
    })
    .then(function(risefiles){  //增量文件列表copy到构建目录 done
        var df = q.defer();
        var tempBase = path.resolve(useConfig.temp);
        var destBase = path.resolve(useConfig.dest);

        process.nextTick(function copy(){
            var tempPath = risefiles.shift();
            if(!tempPath){
                gulputil.log(gulputil.colors.green('增量文件复制到构建目录完成'));
                return df.resolve();
            }
            var destPath = tempPath.replace(tempBase, destBase);
            ndir.copyfile(tempPath, destPath, function(err){
                if(err){
                    throw err;
                }
                copy();
            });
        });
        return df.promise;
    })
    .then(function(){
        var df = q.defer();

        df.resolve();
        defer.resolve();

        return df.promise;
    })
    .done();

    return defer.promise;
})
