import gulp from 'gulp';
import babel from 'gulp-babel';
import {expect} from 'chai';
import equalFileContents from '../src/equal-file-contents';
import streamToPromise from 'stream-to-promise';
import {tmpDir} from 'cleanup-wrapper';

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

  describe(`Dest is outside the package directory tree`, function() {

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

});
/*
describe('Testing equalStreamContents withmore than 16 files', function() {

  it(`equalStreamContents returns a promise that resolves on equality`,
    function() {
      return equalStreamContents(gulp.src('test/files/*'),
        gulp.src('test/files/*'));
    });

  it(`equalStreamContents returns a promise that rejects on inequality`,
    function() {
      return equalStreamContents(gulp.src('test/files/*'),
        gulp.src(['test/files/*', '!test/files/z'])).catch(err => {
          expect(err.toString()).to.match(/AssertionError: expected \{ Object.* to deeply equal \{ Object/);
        });
    });

});
*/
