const gulp = require('gulp');
const pug = require('gulp-pug');
const del = require('del');

gulp.task('watch', () => {
    gulp.watch(['./src/*.pug'], () => {
        gulp.start(['pug']);
    });
});

gulp.task('pug', () => {
    return gulp.src('./src/*.pug')
        .pipe(pug({
            'pretty': true
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('clean', () => {
    del('./*.html');
});
