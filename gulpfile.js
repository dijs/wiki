var gulp = require('gulp');
var babel = require('gulp-babel');
var coveralls = require('gulp-coveralls');

gulp.task('compile', function() {
	return gulp
		.src(['src/*.js', 'test/spec.js'])
		.pipe(babel())
		.pipe(gulp.dest('dist'));
});

gulp.task('debug', ['compile'], function() {
	gulp.watch(['src/*.js', 'test/*.js'], ['compile']);
});

gulp.task('coveralls', function() {
	return gulp.src('./coverage/lcov.info').pipe(coveralls());
});

gulp.task('default', ['compile']);