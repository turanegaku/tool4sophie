const gulp = require('gulp');
const pug = require('gulp-pug');
const del = require('del');

gulp.task('watch', () => {
    gulp.watch(['./src/*.pug'], ['pug']);
});

gulp.task('pug', () => {
    return gulp.src('./src/*.pug')
    .pipe(pug())
    .pipe(gulp.dest('./docs'));
});

gulp.task('clean', () => {
    del('./*.html');
});
