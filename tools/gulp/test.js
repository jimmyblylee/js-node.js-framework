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
 * Description: 测试helper的函数.<br>
 * Created by Jimmybly Lee on 2018/1/4.
 * @author Jimmybly Lee
 */
var gulp = require('gulp');
var helper = require('./helper');
var gutil = require('gulp-util');
var fs = require('fs');
var del = require('del');
var through = require('through2');
var concat = require('gulp-concat');

/**
 * 清除所有生成资源的目录
 */
gulp.task('testMethod', function () {
    // testing getFolders
    gutil.log("|- Method getFolders:" + helper.getFolders("../src"));

    // testing getProjects
    gutil.log("|- Method getProjects:" + helper.getProjects());

    // testing baseName
    gutil.log("|- Method baseName: bad  '" + helper.baseName("../abc/def") + "'");
    gutil.log("|- Method baseName: good '" + helper.baseName("../abc/def/ghi.css") + "'");

    // testing dotPath
    gutil.log("|- Method dotPath: " + helper.dotPath("{$config.path.node_modules}/fullcalendar/dist/fullcalendar.css"));

    // testing objectWalkRecursive
    gutil.log("|- Method objectWalkRecursive: start");
    helper.objectWalkRecursive({"a": {"b": {"c": "d"}}}, function (val) {
        for (var type in val) {
            gutil.log("|- \t" + type + ":" + val);
        }
    });
    gutil.log("|- Method objectWalkRecursive: end");

    // testing outputChannel
    var outputChannelPaths = [];
    gulp.src(["./conf/default.json"])
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- Method outputChannel: start");
            gutil.log("|- \tgenerating file default.json");
            cb(null, chunk);
        }))
        .pipe(helper.outputChannel("{$config.output}/test")())
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \tchecking file:");
            helper.getProjects().forEach(function (path) {
                var dir = "./../dist/" + path + "/resources/test";
                outputChannelPaths.push(dir);
                var file = dir + "/default.json";
                gutil.log("|- \t\t" + file + " exists ? " + fs.existsSync(file));
            });
            cb(null, chunk);
        }))
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \terasing trail");
            gutil.log("|- \t\tpaths to erase:\t" + outputChannelPaths);
            del(outputChannelPaths, {force: true});
            gutil.log("|- Method outputChannel: end");
            cb(null, chunk);
        }));

    // testing jsChannel
    var jsChannelPaths = [];
    gulp.src([
        "./node_modules/bootstrap/dist/js/bootstrap.js",
        "./node_modules/bootstrap/dist/js/npm.js"])
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- Method jsChannel: start");
            gutil.log("|- \tcompiling");
            cb(null, chunk);
        }))
        .pipe(concat("test.bundle.js"))
        .pipe(helper.jsChannel()())
        .pipe(helper.outputChannel("{$config.output}/test-bundle/test.bundle.js", "test.bundle.js")())
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \tchecking file:");
            helper.getProjects().forEach(function (path) {
                var dir = "./../dist/" + path + "/resources/test-bundle-js";
                jsChannelPaths.push(dir);
                var file = dir + "/test.bundle.js";
                gutil.log("|- \t\t" + file + " exists ? " + fs.existsSync(file));
            });
            cb(null, chunk);
        }))
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \terasing trail");
            gutil.log("|- \t\tpaths to erase:\t" + jsChannelPaths);
            del(jsChannelPaths, {force: true});
            gutil.log("|- Method jsChannel: end");
            cb(null, chunk);
        }));

    // testing cssChannel
    var cssChannelPaths = [];
    gulp.src([
        "./node_modules/bootstrap/dist/css/bootstrap.css",
        "./node_modules/bootstrap/dist/css/bootstrap-theme.css"])
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- Method cssChannel: start");
            gutil.log("|- \tcompiling");
            cb(null, chunk);
        }))
        .pipe(helper.cssRewriter("{$config.output}/test-bundle-css/test.bundle.css")())
        .pipe(concat("test.bundle.css"))
        .pipe(helper.cssChannel()())
        .pipe(helper.outputChannel("{$config.output}/test-bundle-css/test.bundle.css", "test.bundle.css")())
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \tchecking file:");
            helper.getProjects().forEach(function (path) {
                var dir = "./../dist/" + path + "/resources/test-bundle-css";
                cssChannelPaths.push(dir);
                var file = dir + "/test.bundle.css";
                gutil.log("|- \t\t" + file + " exists ? " + fs.existsSync(file));
            });
            cb(null, chunk);
        }))
        .pipe(through.obj(function (chunk, enc, cb) {
            gutil.log("|- \terasing trail");
            gutil.log("|- \t\tpaths to erase:\t" + cssChannelPaths);
            del(cssChannelPaths, {force: true});
            gutil.log("|- Method cssChannel: end");
            cb(null, chunk);
        }));
});
