const path = require('path');
const {lstatSync, readdirSync} = require('fs');
const exec = require('child_process').exec;
const gulp = require('gulp');
const gulpSeq = require('gulp-sequence');
const webpack = require('webpack');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const postcss = require('gulp-postcss');
const gulpif = require('gulp-if');
const del = require('del');
const jsonMerge = require('gulp-merge-json');
const jsBeautify = require('gulp-jsbeautifier');
const svg2png = require('gulp-rsvg');
const imagemin = require('gulp-imagemin');

const targetEnv = process.env.TARGET_ENV;
const isProduction = process.env.NODE_ENV === 'production';

const jsBeautifyOptions = {
  indent_size: 2,
  preserve_newlines: false,
  end_with_newline: true
};

gulp.task('clean', function() {
  return del(['dist']);
});

gulp.task('js:webpack', function(done) {
  exec('webpack --display-error-details --colors', function(
    err,
    stdout,
    stderr
  ) {
    console.log(stdout);
    console.log(stderr);
    done(err);
  });
});

gulp.task('js:babel', function() {
  return gulp
    .src('src/content/**/*.js', {base: '.'})
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});

gulp.task('js', ['js:webpack', 'js:babel']);

gulp.task('html', function() {
  return gulp
    .src('src/**/*.html', {base: '.'})
    .pipe(gulpif(isProduction, htmlmin({collapseWhitespace: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('icons', function() {
  return gulp
    .src('src/**/*.svg', {base: '.'})
    .pipe(svg2png())
    .pipe(gulpif(isProduction, imagemin()))
    .pipe(gulp.dest('dist'));
});

gulp.task('fonts', function() {
  gulp
    .src('src/fonts/roboto.css', {base: '.'})
    .pipe(postcss())
    .pipe(gulp.dest('dist'));
  gulp
    .src('node_modules/typeface-roboto/files/roboto-latin-@(400|500).woff2')
    .pipe(gulp.dest('dist/src/fonts/files'));
});

gulp.task('locale', function() {
  const customTargets = ['firefox'];
  if (customTargets.indexOf(targetEnv) !== -1) {
    const localesRootDir = path.join(__dirname, 'src/_locales');
    const localeDirs = readdirSync(localesRootDir).filter(function(file) {
      return lstatSync(path.join(localesRootDir, file)).isDirectory();
    });
    localeDirs.forEach(function(localeDir) {
      const localePath = path.join(localesRootDir, localeDir);
      gulp
        .src([
          path.join(localePath, 'messages.json'),
          path.join(localePath, `messages-${targetEnv}.json`)
        ])
        .pipe(jsonMerge({fileName: 'messages.json'}))
        .pipe(gulpif(isProduction, jsBeautify(jsBeautifyOptions)))
        .pipe(gulp.dest(path.join('dist/_locales', localeDir)));
    });
  } else {
    gulp
      .src('src/_locales/**/messages.json')
      .pipe(gulpif(isProduction, jsBeautify(jsBeautifyOptions)))
      .pipe(gulp.dest('dist/_locales'));
  }
});

gulp.task('copy', function() {
  gulp
    .src(['src/manifest.json', 'LICENSE', 'src*/icons/**/*.png'])
    .pipe(gulp.dest('dist'));
});

gulp.task(
  'build',
  gulpSeq('clean', ['js', 'html', 'icons', 'fonts', 'locale', 'copy'])
);

gulp.task('default', ['build']);
