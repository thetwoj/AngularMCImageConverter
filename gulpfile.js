/**
 * Created by JJ on 9/7/2015.
 */
var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('serve', function() {
    browserSync.init({
        server: {
            baseDir:"./app"
        }
    });

    gulp.watch("app/**/*.*").on('change', browserSync.reload);
});