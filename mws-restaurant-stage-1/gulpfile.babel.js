/*eslint-env node */
/*eslint linebreak-style: ["error", "windows"]*/

var gulp = require('gulp');
var critical = require('critical');

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('styles', function() {
    return gulp.src('css/styles.css')
		.pipe($.autoprefixer('last 1 version'))
		.pipe(gulp.dest('.tmp/css'))
		.pipe($.size());
});

gulp.task('styles-dist', function() {
    return gulp.src('css/**/*.css')
		.pipe($.cssnano())
		.pipe($.autoprefixer({
			browsers: ['last 2 versions']
        }))
		.pipe(gulp.dest('dist/css'));
});

gulp.task('idb', function() {
	gulp.src('node_modules/idb/lib/idb.js')
		.pipe($.uglify())
		.pipe(gulp.dest('dist/lib'));
});

gulp.task('scripts', function() {
	gulp.src('js/**/*js')
		.pipe($.sourcemaps.init({loadMaps: true}))
		.pipe($.babel())
		.pipe($.uglify())
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('html', ['styles'], function () {
    var jsFilter = $.filter('**/*.js', {restore: true});
    var cssFilter = $.filter('**/*.css' , {restore: true});
    var assets = $.useref({searchPath: ['.tmp','./']});

    return gulp.src('*.html')
        .pipe(assets)
		.pipe(jsFilter)
		.pipe($.babel())
        .pipe($.uglify())
        .pipe(jsFilter.restore)
        .pipe(cssFilter)
        .pipe($.cssnano())
        .pipe(cssFilter.restore)
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', ['html', 'copy-images', 'manifest', 'idb', 'sw-dist', 'lint', 'styles-dist', 'scripts', 'gzip']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

// Generate & Inline Critical-path CSS
gulp.task('critical', ['build', 'critical-restaurant'], function () {
    critical.generate({
        inline: true,
        base: 'dist/',
        src: 'index.html',
        dest: 'dist/index.html',
		width: 567,
        height: 812,
        minify: true
    });
});

// Generate & Inline Critical-path CSS
gulp.task('critical-restaurant', function () {
    critical.generate({
        inline: true,
        base: 'dist/',
        src: 'restaurant.html',
        dest: 'dist/restaurant.html',
        width: 414,
        height: 812,
        minify: true
    });
});

gulp.task('gzip', function() {
	gulp.src('dist/js/**/*.js')
		.pipe($.gzip())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('sw-dist', function() {
	gulp.src('sw.js')
		.pipe($.babel())
		.pipe($.uglify())
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-images', function() {
	gulp.src('img/*')
		.pipe(gulp.dest('dist/img'));
	gulp.src('img/touch/*')
        .pipe(gulp.dest('dist/img/touch'));
    gulp.src('responsive-images/*')
		.pipe(gulp.dest('dist/responsive-images'));
});

gulp.task('manifest', function() {
	gulp.src('manifest.json')
		.pipe(gulp.dest('dist/'));
});

gulp.task('lint', function () {
	return gulp.src(['js/**/*.js'])
		.pipe($.eslint())
		.pipe($.eslint.format())
		.pipe($.eslint.failOnError());
});