var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var prefix = require('gulp-autoprefixer');
var cssmin = require('gulp-clean-css');
var concat = require("gulp-concat");
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var reporter = require('postcss-reporter');
var syntax_scss = require('postcss-scss');
var stylelint = require('stylelint');
var newer = require('gulp-newer');
var del = require('del');
var path = require('path');
var merge = require('merge-stream');

/**
 * Launch the Server
 */
gulp.task('browser-sync', ['sync'], function () {
    browserSync.init(null, {
        // Change as required
        server: {
          baseDir: "public/"
        }
    });
});

/**
 * Compile files from scss after lint
 */
gulp.task("scss-lint", function() {
  
  /**
   * SCSS stylelint
   * refer to article "http://www.creativenightly.com/2016/02/How-to-lint-your-css-with-stylelint/"
   * https://gist.github.com/KingScooty/fa4aab7852dd30feb573#file-gulpfile-js
   */

    // Stylelint config rules
    var stylelintConfig = {
        "rules": {
            "block-no-empty": true,
            "color-no-invalid-hex": true,
            "declaration-colon-space-after": "always",
            "declaration-colon-space-before": "never",
            "function-comma-space-after": "always",
            "function-url-quotes": "always",
            "media-feature-colon-space-after": "always",
            "media-feature-colon-space-before": "never",
            "media-feature-name-no-vendor-prefix": true,
            "max-empty-lines": 5,
            "number-no-trailing-zeros": true,
            "property-no-vendor-prefix": true,
            "block-opening-brace-newline-after": "always",
            "block-closing-brace-newline-before": "always",
            "declaration-block-trailing-semicolon": "always",
            "selector-list-comma-space-before": "never",
            "string-quotes": "double",
            "value-no-vendor-prefix": true
        }
    }

    var processors = [
        stylelint(stylelintConfig),
        reporter({
            clearMessages: true
        })
    ];

    gulp.src(
    ['dev/sass/*.scss', 'dev/sass/**/*.scss',
    // Ignore linting vendor assets
    // Useful if you have bower components
    '!dev/sass/_settings.scss', '!dev/sass/_components.ie-specific.scss', '!dev/sass/_shame.scss', '!dev/sass/_tools.scss', '!dev/sass/lib/*.scss', '!dev/sass/bootstrap/*.scss', '!dev/sass/bootstrap/mixins/*.scss']
    )
    .pipe(postcss(processors, {syntax: syntax_scss}));
});

/**
 * Compile files from scss
 */
gulp.task('css-concat', ['sass'], function () {
    gulp.src(['dev/css/ie10-viewport-bug-workaround.css', 'dev/css/styles.css'])
        .pipe(concat('global.css'))
        .pipe(gulp.dest('dev/css/'));
});

gulp.task('sass', ['scss-lint'], function () {
    var scssStream,
    cssStream;

    scssStream = gulp.src(['dev/sass/styles.scss'])
        // .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        // .pipe(sourcemaps.write('dev/css/'))
        .pipe(prefix(['last 5 versions', '> 5%', 'ie 9'], {cascade: true}))
        .pipe(gulp.dest('dev/css/'));

    cssStream = gulp.src(['dev/css/ie10-viewport-bug-workaround.css']);

    return merge(scssStream, cssStream)
        .pipe(concat('styles.css'))
        .pipe(sourcemaps.init())
        // .pipe(cssmin())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('public/css/'))
        //.pipe(browserSync.stream());
        .pipe(browserSync.reload({stream: true}));
});

gulp.task('sass-prod', function () {
    return gulp.src(['dev/sass/styles.scss'])
        // .pipe(sourcemaps.init())
        .pipe(sass({
            includePaths: ['scss']
        }))
        // .pipe(sourcemaps.write('dev/css/'))
        .pipe(prefix(['last 5 versions', '> 5%', 'ie 9'], {cascade: true}))
        .pipe(cssmin())
        .pipe(gulp.dest('dev/css/'));
});

/**
 * Minify custom js scripts
 */
gulp.task('scripts', function () {
    return gulp.src(['dev/js/lib/jquery-3.0.0.min.js', 'dev/js/lib/jquery-migrate-3.0.0.min.js', 'dev/js/lib/bootstrap.min.js', 'dev/js/lib/ie10-viewport-bug-workaround.js','dev/js/lib/rem.js', 'dev/js/init.js'])
        .pipe(concat('app.min.js'))
        // .pipe(gulp.dest('dev/js/'))
        // .pipe(newer('public/js/'))
        // .pipe(rename('app.min.js'))
        .pipe(gulp.dest('public/js/'))
        .pipe(browserSync.stream());
        // .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts-prod', function () {
    return gulp.src('dev/js/app.min.js')
        .pipe(uglify())
        .pipe(newer('public/js/'))
        //.pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('public/js/'));
});

/**
 * Reload page when views change
 */
 gulp.task('views', ['sass'], function () {
   gulp.src(['dev/css/styles.css'])
     .pipe(newer('public/css/'))
     .pipe(gulp.dest('public/css/'))
     .pipe(browserSync.stream());
     // .pipe(browserSync.reload({stream: true}));
});

gulp.task('copy-files', function() {  
    gulp.src(['dev/*', '!dev/{sass,sass/**}'])
        .pipe(gulp.dest('public/'));
});

gulp.task('sync', function() {
    gulp.src(['dev/*', 'dev/**/*', '!dev/{sass,sass/**}', '!dev/js/{init.js,lib/**}'])
        .pipe(newer('public/'))
        .pipe(gulp.dest('public/'))
        .pipe(browserSync.stream());
        // .pipe(browserSync.reload({stream: true}));
        // console.log('Copy Done');
});

/**
 * Watch scss files for changes & recompile
 * Watch views folder for changes and reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch(['dev/sass/*.scss', 'dev/sass/**/*.scss'], ['sass']);
    gulp.watch(['dev/js/**/*'], ['scripts']);
    //gulp.watch(['dev/js/app.min.js'], ['sync']);
    gulp.watch(['dev/images/*', 'dev/images/**/*'], ['sync']);
    gulp.watch(['dev/fonts/*'], ['sync']);
    gulp.watch(['dev/*.html'], ['sync']);
    //gulp.watch(['dev/**/*', '!dev/{sass,sass/**}'], ['sync']);

    var watcher = gulp.watch(['dev/*', 'dev/**/*', '!dev/{sass,sass/**}', '!dev/css/styles.css', '!dev/css/global.css.map', '!dev/js/init.js']);
    watcher.on('change', function(ev) {
         if(ev.type === 'deleted') {
            /**
             * Sync up deleted files between 2 folder on harddisk
             * refer to article "https://fettblog.eu/gulp-recipes-part-2/#sync-directories-on-your-harddisk"
             */
            
            //console.log('file deleted');
            // console.log(path.relative('./', ev.path).replace('dev/','public/'));
            del(path.relative('./', ev.path).replace('dev/','public/'));
         }
    });
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the scripts, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
gulp.task('build', ['sass-prod', 'scripts-prod']);