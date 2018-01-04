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
 * Description: 编译，打包，复制.<br>
 * Created by Jimmybly Lee on 2018/1/4.
 * @author Jimmybly Lee
 */
var gulp = require('gulp');
var sequence = require('run-sequence');
var build = require('./build');
var helper = require('./helper');
var gutil = require('gulp-util');

// 任务：打包js和css
gulp.task('build-bundle', function(cb) {
    // 如果指定了project，则只打包指定的project，否则全打包
    if (build.config.page !== '') {
        for (var page in build.build.pages) {
            if (!build.build.pages.hasOwnProperty(page)) continue;
            if (build.config.page !== page) {
                delete build.build.pages[page];
            }
        }
    }
    helper.objectWalkRecursive(build.build, function(val) {
        if (typeof val.src !== 'undefined') {
            if (typeof val.bundle !== 'undefined') {
                // 需要集中打包型配置
                helper.bundle(val);
            }
            if (typeof val.output !== 'undefined') {
                // 直接拷贝型配置
                helper.output(val);
            }
        }
    });
    cb();
});

// entry point
gulp.task('default', ['clean'], function(cb) {
    // clean first and then start bundling
    return sequence(['build-bundle'], cb);
});
