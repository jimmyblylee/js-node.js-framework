/* ***************************************************************************
 * Copyright (C) 2018-2019 the original author Jimmybly Lee
 * or authors of NAPTUNE.COM
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of MIT License as published by
 * the Free Software Foundation;
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the MIT License for more details.
 *
 * You should have received a copy of the MIT License along
 * with this library; if not, write to the Free Software Foundation.
 * ***************************************************************************/

/**
 * Description: Helper Methods.<br>
 * Created by Jimmybly Lee on 2018/1/3.
 * @author Jimmybly Lee
 */

'use strict';

var gulp = require('gulp');
var sass = require('gulp-sass');
var rewrite = require('gulp-rewrite-css');
var concat = require('gulp-concat');
var lazyPipe = require('lazypipe');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var cleanCss = require('gulp-clean-css');
var sourceMaps = require('gulp-sourcemaps');
var build = require('./build');
var path = require('path');
var fs = require('fs');
var filter = require('gulp-filter');
var gutil = require('gulp-util');

module.exports = {

    // default variable config
    config: Object.assign({}, {
        demo: '',
        debug: true,
        compile: {
            jsUglify: false,
            cssMinify: false,
            jsSourceMaps: false,
            cssSourceMaps: false
        }
    }, build.config),

    // 根目录
    rootPath: './../',

    // 工程目录，可以支持多个相关工程
    projectsPath: 'src/js/projects',

    includePaths: ['src/sass/framework', 'src/sass/framework/vendors/bootstrap'],


    /**
     * 添加js编译操作
     */
    jsChannel: function () {
        var config = this.config.compile;
        // noinspection JSUnresolvedFunction
        return lazyPipe().pipe(function () {
            return gulpif(config.jsSourceMaps, sourceMaps.init({loadMaps: true, debug: config.debug}));
        }).pipe(function () {
            return gulpif(config.jsUglify, uglify());
        }).pipe(function () {
            return gulpif(config.jsSourceMaps, sourceMaps.write('./'));
        });
    },

    /**
     * 添加css编译操作
     */
    cssChannel: function () {
        var config = this.config.compile;
        var includePaths = module.exports.includePaths.map(function (path) {
            return module.exports.rootPath + path;
        });
        // noinspection JSUnresolvedFunction
        return lazyPipe().pipe(function () {
            return gulpif(config.cssSourceMaps, sourceMaps.init({loadMaps: true, debug: config.debug}));
        }).pipe(function () {
            // noinspection JSUnresolvedFunction
            return sass({
                errLogToConsole: true,
                includePaths: includePaths
            }).on('error', sass.logError);
        }).pipe(function () {
            return gulpif(config.cssMinify, cleanCss({debug: config.debug}));
        }).pipe(function () {
            return gulpif(config.cssSourceMaps, sourceMaps.write('./'));
        });
    },

    /**
     * 根据输出配置输出文件
     * 如果outputFile为空，则把gulp.src指定的文件全部拷贝到path
     * @param path
     * @param outputFile
     * @returns {*}
     */
    outputChannel: function (path, outputFile) {
        if (typeof outputFile === 'undefined') outputFile = '';
        var piping = lazyPipe();

        var regex = new RegExp(/\{\$.*?\}/);
        var matched = path.match(regex);
        if (matched) {
            var outputs = build.config.dist;
            outputs.forEach(function (output) {
                if (output.indexOf('/**/') !== -1) {
                    module.exports.getProjects().forEach(function (project) {
                        var outputPath = path.replace(matched[0], output.replace('**', project)).replace(outputFile, '');
                        var f = filter(outputPath, {restore: true});
                        // 排除非关联资源
                        if (outputPath.indexOf('/resources/projects/') !== -1 && outputPath.indexOf('/resources/projects/' + project) === -1) {
                            // noinspection JSUnresolvedFunction
                            piping = piping.pipe(function () {
                                return f;
                            });
                        }
                        (function (_output) {
                            // noinspection JSUnresolvedFunction
                            piping = piping.pipe(function () {
                                return gulp.dest(_output);
                            });
                        })(outputPath);
                        piping = piping.pipe(function () {
                            return f.restore;
                        });
                    });
                } else {
                    var outputPath = path.replace(matched[0], output).replace(outputFile, '');
                    (function (_output) {
                        // noinspection JSUnresolvedFunction
                        piping = piping.pipe(function () {
                            return gulp.dest(_output);
                        });
                    })(outputPath);
                }
            });
        }

        return piping;
    },

    /**
     * 重写css的url(...) 以及@import等
     * @param folder
     */
    cssRewriter: function (folder) {
        var imgRegex = new RegExp(/\.(gif|jpg|jpeg|tiff|png|ico)$/i);
        var fontRegex = new RegExp(/\.(otf|eot|svg|ttf|woff|woff2)$/i);
        var config = this.config;

        // noinspection JSUnresolvedFunction
        return lazyPipe().pipe(function () {
            // rewrite css relative path
            return rewrite({
                destination: folder,
                debug: config.debug,
                adaptPath: function (ctx) {
                    var isCss = ctx.sourceFile.match(/\.[css]+$/i);
                    // 只处理css
                    if (isCss[0] === '.css') {
                        var pieces = ctx.sourceDir.split(/\\|\//);

                        var vendor = pieces[pieces.indexOf('node_modules') + 1];
                        if (pieces.indexOf('node_modules') === -1) {
                            vendor = pieces[pieces.indexOf('vendors') + 1];
                        }

                        var file = module.exports.baseName(ctx.targetFile);

                        var extension = 'fonts/';
                        if (imgRegex.test(file)) {
                            extension = 'images/';
                        }

                        return path.join(extension + vendor, file);
                    }
                }
            });
        });
    },

    /**
     * Bundle
     * @param bundle
     */
    bundle: function (bundle) {
        var _self = this;
        var tasks = [];
        var type;

        if (typeof bundle.src !== 'undefined' && typeof bundle.bundle !== 'undefined') {
            // 第三方供应商的图片和字体文件，直接拷贝到目标目录
            if ('mandatory' in bundle.src && 'optional' in bundle.src) {
                var vendors = {};

                for (var key in bundle.src) {
                    if (!bundle.src.hasOwnProperty(key)) continue;
                    vendors = Object.assign(vendors, bundle.src[key]);
                }

                for (var vendor in vendors) {
                    if (!vendors.hasOwnProperty(vendor)) continue;

                    var vendorObj = vendors[vendor];

                    for (type in vendorObj) {
                        if (!vendorObj.hasOwnProperty(type)) continue;

                        _self.dotPaths(vendorObj[type]);

                        switch (type) {
                            case 'fonts':
                                gulp.src(vendorObj[type]).pipe(_self.outputChannel(bundle.bundle.fonts + '/' + vendor)());
                                break;
                            case 'images':
                                gulp.src(vendorObj[type]).pipe(_self.outputChannel(bundle.bundle.images + '/' + vendor)());
                                break;
                        }
                    }
                }
            }

            // 递归获取所有的css以及js数组并放把这些数组链接到一起，方便后续处理，针对第三方插件引用vendors的结构化配置
            if (!('styles' in bundle.src) && !('scripts' in bundle.src)) {
                var src = {styles: [], scripts: []};
                _self.objectWalkRecursive(bundle.src, function (paths, type) {
                    switch (type) {
                        case 'styles':
                        case 'scripts':
                            src[type] = src[type].concat(paths);
                            break;
                    }
                });
                bundle.src = src;
            }

            // 链接并打包css和js
            for (type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;

                // 格式校验：如果不是数组或者没有bundle配置
                if (Object.prototype.toString.call(bundle.src[type]) !== '[object Array]') continue;
                if (typeof bundle.bundle[type] === 'undefined') continue;

                _self.dotPaths(bundle.src[type]);
                var outputFile = _self.baseName(bundle.bundle[type]);

                switch (type) {
                    case 'styles':
                        gulp.src(bundle.src[type]).pipe(_self.cssRewriter(bundle.bundle[type])()).pipe(concat(outputFile)).pipe(_self.cssChannel()()).pipe(_self.outputChannel(bundle.bundle[type], outputFile)());
                        break;

                    case 'scripts':
                        return gulp.src(bundle.src[type]).pipe(concat(outputFile)).pipe(_self.jsChannel()()).pipe(_self.outputChannel(bundle.bundle[type], outputFile)());
                        break;

                    default:
                        break;
                }
            }
        }
        return tasks;
    },

    /**
     * 拷贝代码到dist文件夹。单纯的拷贝行为，会根据全局变量决定是否压缩和扰码
     * @param bundle
     */
    output: function (bundle) {
        var _self = this;

        if (typeof bundle.src !== 'undefined' && typeof bundle.output !== 'undefined') {
            for (var type in bundle.src) {
                if (!bundle.src.hasOwnProperty(type)) continue;

                _self.dotPaths(bundle.src[type]);

                switch (type) {
                    case 'styles':
                        gulp.src(bundle.src[type]).pipe(_self.cssChannel()()).pipe(_self.outputChannel(bundle.output[type])());
                        break;
                    case 'scripts':
                        gulp.src(bundle.src[type]).pipe(_self.jsChannel()()).pipe(_self.outputChannel(bundle.output[type])());
                        break;
                    default:
                        gulp.src(bundle.src[type]).pipe(_self.outputChannel(bundle.output[type])());
                        break;
                }
            }
        }
    },

    /**
     * 获得项目所管辖工程文件夹路径
     * @returns 文件夹路径字符串数组
     */
    getProjects: function () {
        return this.getFolders(module.exports.rootPath + module.exports.projectsPath);
    },

    /* ******************** 无业务通用辅助函数 ******************** */
    /**
     * 递归遍历对象，并执行给定函数(子结构优先)
     * @param targetObj 配置对象
     * @param func 递归执行函数
     * @param userData 附加参数
     * @returns {boolean}
     */
    objectWalkRecursive: function (targetObj, func, userData) {
        if (!targetObj || typeof targetObj !== 'object') {
            return false;
        }
        if (typeof func !== 'function') {
            return false;
        }
        for (var key in targetObj) {
            if (!targetObj.hasOwnProperty(key)) continue;

            // 只有对象时，执行函数
            if (Object.prototype.toString.call(targetObj[key]) === '[object Object]') {
                var funcArgs = [targetObj[key], func];
                if (arguments.length > 2) {
                    funcArgs.push(userData);
                }
                if (module.exports.objectWalkRecursive.apply(null, funcArgs) === false) {
                    return false;
                }
            }
            try {
                if (arguments.length > 2) {
                    func(targetObj[key], key, userData);
                } else {
                    func(targetObj[key], key);
                }
            } catch (e) {
                return false;
            }
        }
        return true;
    },

    /**
     * 获得给定目录下的所有文件夹路径，
     * @param dir 目标父文件夹
     * @return 文件夹路径字符串数组
     */
    getFolders: function (dir) {
        // noinspection JSUnresolvedFunction
        return fs.readdirSync(dir).filter(function (file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
    },

    /**
     * 获得文件路径字符串的文件名称，默认文件有后缀所以会有字符'.'
     * @param path
     * @returns {string}
     */
    baseName: function (path) {
        var maybeFile = path.split('/').pop();
        if (maybeFile.indexOf('.') !== -1) {
            return maybeFile;
        }
        return '';
    },

    /**
     * 替换路径中的通配符'{$config.path.node_modules}'，通过build中的配置进行替换相应的值
     * @param paths 路径数组
     */
    dotPaths: function (paths) {
        paths.forEach(function (path, i) {
            paths[i] = module.exports.dotPath(path);
        });
    },

    /**
     * 替换路径中的通配符'{$config.path.node_modules}'，通过build中的配置进行替换相应的值
     * @param path 路径
     * @returns {*}
     */
    dotPath: function (path) {
        var regex = new RegExp(/\{\$(.*?)\}/),
            dot = function (obj, i) {
                return obj[i];
            };
        var matched = path.match(regex);
        if (matched) {
            var realPath = matched[1].split('.').reduce(dot, build);
            return path = path.replace(matched[0], realPath);
        }

        return path;
    }
};
