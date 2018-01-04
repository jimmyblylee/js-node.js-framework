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
 * Description: clean the dist folder.<br>
 * Created by Jimmybly Lee on 2018/1/3.
 * @author Jimmybly Lee
 */
var gulp = require('gulp');
var del = require('del');
var build = require('./build');
var helper = require('./helper');
var gutil = require('gulp-util');

/**
 * 获得所有可能输出的结果目录
 * @returns {Array}
 */
var getPaths = function() {
    var paths = [];
    var outputs = build.config.dist;
    outputs.forEach(function(output) {
        helper.getProjects().forEach(function(path) {
            paths.push(output.replace('**', path));
        });
    });
    return paths;
};

/**
 * 清除所有生成资源的目录
 */
gulp.task('clean', function() {
    gutil.log("|- Cleaning generated resources folder start");
    // 输出配置信息
    gutil.log("|- Dist folder: " + build.config.dist);
    gutil.log("|- Project folders(will be deleted): ");
    var paths = getPaths();
    paths.forEach(function (path) {
        gutil.log("|-\t> " + path);
    });
    // 删除旧的文件夹（程序生成的）
    var cl = del(paths, {force: true});
    gutil.log("|- Cleaning generated resources folder end");
    return cl;
});
