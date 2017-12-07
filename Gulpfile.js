const gulp = require('gulp');
const jsHint = require('gulp-jshint');
const mocha = require('gulp-mocha');

const tests = 'test/**/*.test.js';
const sources = 'lib/**/*.js';
const allFiles = [ sources, tests ];

gulp.task('lint', function() {
  return gulp.src(allFiles).pipe(jsHint({
    esversion: 6,
    expr: true
  })).pipe(jsHint.reporter('default'));
});

gulp.task('test', function() {
  return gulp.src(tests).pipe(mocha());
});

gulp.task('watch', function() {
  return gulp.watch(allFiles, ['default']);
});

gulp.task('default', ['lint', 'test']);
gulp.task('develop', ['watch']);
