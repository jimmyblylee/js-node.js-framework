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
 * Description: 监听css以及js变化，实时热部署.<br>
 * Created by Jimmybly Lee on 2018/1/4.
 * @author Jimmybly Lee
 */
var gulp = require('gulp');
var build = require('./build');

gulp.task('watch', function () {
    gulp.watch([build.config.path.src + '/sass/**/*.scss', build.config.path.src + '/js/**/*.js'], ['build-bundle']);
});

gulp.task('watch:scss', function () {
    gulp.watch(build.config.path.src + '/sass/**/*.scss', ['build-bundle']);
});

gulp.task('watch:js', function () {
    gulp.watch(build.config.path.src + '/js/**/*.js', ['build-bundle']);
});
