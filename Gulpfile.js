'use strict';

var argv = require('yargs').argv;
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var collapse = require('bundle-collapser/plugin');
var connect = require('gulp-connect');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var rimraf = require('rimraf');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var watchify = require('watchify');

gulp.task('js', function() {
  return bundler
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(gulpif(!argv.production, sourcemaps.init({loadMaps: true})))
    .pipe(gulpif(!argv.production, sourcemaps.write('../maps')))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest('js'));
});

gulp.task('watchify', function() {
  var watcher = watchify(bundler);
  return watcher
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .on('update', function () {
      watcher.bundle()
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('js'));

      gutil.log('Updated JavaScript sources');
    })
    .bundle();
});

gulp.task('server', function() {
  connect.server({
    root: '.',
    livereload: true
  });
});

gulp.task('reload', function () {
  gulp.src('index.html')
    .pipe(connect.reload());
});

gulp.task('watch', function (cb) {
  runSequence('default', 'server', 'watchify', cb);
});

gulp.task('default', ['js']);

var bundler = browserify({
  entries: ['./src/main.js'],
  debug: !argv.production
});

if (argv.production) {
  bundler.plugin(collapse);
}
