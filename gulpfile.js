var gulp = require('gulp');
var coveralls = require('gulp-coveralls');

gulp.task('coveralls', function() {
	return gulp.src('./coverage/lcov.info').pipe(coveralls());
});
