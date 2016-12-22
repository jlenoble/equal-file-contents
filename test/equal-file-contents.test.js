import gulp from 'gulp';
import babel from 'gulp-babel';
import path from 'path';
import {expect} from 'chai';
import equalFileContents from '../src/equal-file-contents';
import streamToPromise from 'stream-to-promise';
import {tmpDir} from 'cleanup-wrapper';
import mkdirp from 'mkdirp';
import touch from 'touch';

describe('Testing equalFileContents', function() {

  const cwd = process.cwd();

  describe(`Pipe is noop()`, function() {

    it(`equalFileContents returns a promise that resolves on equality`,
      function() {
        return equalFileContents('gulp/**/*.js', '.');
      });

    it(`equalFileContents returns a promise that rejects on inequality`,
      function() {
        return equalFileContents('gulp/**/*.js', 'src').catch(err => {
          expect(err.message).to.match(/expected .* to equal/);
        });
      });

  });

  describe(`Pipe is babel()`, function() {

    it(`equalFileContents returns a promise that resolves on equality`,
      tmpDir('tmp', function() {
        return streamToPromise(gulp.src('gulp/**/*.js', {base: cwd})
          .pipe(babel())
          .pipe(gulp.dest('tmp'))).then(() =>
            equalFileContents('gulp/**/*.js', 'tmp', babel));
      }));

    it(`equalFileContents returns a promise that rejects on inequality`,
      tmpDir('tmp', function() {
        return streamToPromise(gulp.src('gulp/**/*.js', {base: cwd})
          .pipe(gulp.dest('tmp'))).then(() =>
            equalFileContents('gulp/**/*.js', 'tmp', babel))
        .catch(err => {
          expect(err.message).to.match(/expected .* to equal/);
        });
      }));

  });

  describe(`Dest is outside the package directory tree`, function() {

    beforeEach(function () {
      this.dest = '/tmp/equalFileContents-test_' + new Date().getTime();
    });

    it(`equalFileContents returns a promise that resolves on equality`,
      function() {
        return streamToPromise(gulp.src('gulp/**/*.js', {base: cwd})
          .pipe(gulp.dest(this.dest))).then(() =>
            equalFileContents('gulp/**/*.js', this.dest));
      });

    it(`equalFileContents returns a promise that rejects on inequality`,
      function() {
        return streamToPromise(gulp.src('gulp/**/*.js', {base: cwd})
          .pipe(gulp.dest(this.dest))).then(() =>
            equalFileContents('gulp/**/*.js', this.dest, babel))
        .catch(err => {
          expect(err.message).to.match(/expected .* to equal/);
        });
      });

  });

  describe(`Dest is deeper inside the package directory tree`, function() {

    const base = 'build_' + new Date().getTime();

    beforeEach(function () {
      this.src = path.join(base, 'src');
      this.dest = path.join(base, 'build');
    });

    it(`equalFileContents returns a promise that resolves on equality`,
      tmpDir(base, function() {
        return streamToPromise(gulp.src('src/**/*.js', {base: cwd})
          .pipe(gulp.dest(base)))
          .then(() => streamToPromise(gulp.src(path.join(this.src, '**/*.js'),
            {base}).pipe(gulp.dest(this.dest))))
          .then(() => equalFileContents(path.join(this.src, '**/*.js'),
            this.dest, undefined, base));
      }));

  });

  describe('Testing with more than 16 files', function() {

    it(`equalFileContents returns a promise that resolves on equality`,
      tmpDir('tmp', function() {
        mkdirp.sync('tmp');
        for (let i = 0; i < 20; i++) {
          touch.sync('tmp/a' + i);
        }
        return equalFileContents('tmp/*', '.');
      }));

    it(`equalFileContents returns a promise that rejects on inequality`,
      tmpDir(['tmp', 'tmp1'], function() {
        mkdirp.sync('tmp');
        mkdirp.sync('tmp1/tmp');
        for (let i = 0; i < 20; i++) {
          touch.sync('tmp/a' + i);
          touch.sync('tmp1/tmp/a' + i);
        }
        return equalFileContents(['tmp/*', '!tmp/a0'], 'tmp1').catch(err => {
          try {
            expect(err.toString()).to.match(/AssertionError: expected \{ Object.* to deeply equal \{ Object/);
          } catch (e) {
            throw err;
          }
        });
      }));

    });

});
