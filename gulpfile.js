let gulp = require('gulp')
let scss = require('gulp-sass')
gulp.task('css', function() {
    return new Promise(function(resolve, reject) {
        return setTimeout(function() {
            return gulp.src('src/css/*.scss')
            .pipe(scss())
            .on('error', function(e) {
                return reject(e) && this.end();
            })
            .pipe(gulp.dest('dist/css'))
            .on('end', resolve)
            //.pipe(reload({stream: true}));
        }, 500);
    }).catch(function(e) {
        return console.warn(e.messageFormatted);
    });
})
gulp.task('reload',function(){})

gulp.task('watch',function(){
	gulp.watch('src/css/*.scss', gulp.series("css"));

})
gulp.task('default', gulp.series("watch"))