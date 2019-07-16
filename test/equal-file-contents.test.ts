/* eslint-disable no-invalid-this */

import gulp from "gulp";
import babel from "gulp-babel";
import path from "path";
import { expect } from "chai";
import equalFileContents from "../src/equal-file-contents";
import streamToPromise from "stream-to-promise";
import { tmpDir } from "cleanup-wrapper";
import mkdirp from "mkdirp";
import touch from "touch";

describe("Testing equalFileContents", (): void => {
  const cwd = process.cwd();

  describe(`Pipe is noop()`, (): void => {
    it(`equalFileContents returns a promise that resolves on equality`, (): Promise<
      boolean
    > => {
      return equalFileContents("gulp/**/*.js", ".");
    });

    it(`equalFileContents returns a promise that rejects on inequality`, async (): Promise<
      void
    > => {
      try {
        await equalFileContents("gulp/**/*.js", "src");
      } catch (err) {
        expect(err.message).to.match(/expected .* to equal/);
      }
    });
  });

  describe(`Pipe is babel()`, (): void => {
    it(
      `equalFileContents returns a promise that resolves on equality`,
      tmpDir(
        "tmp",
        async (): Promise<boolean> => {
          await streamToPromise(
            gulp
              .src("gulp/**/*.js", { base: cwd })
              .pipe(babel())
              .pipe(gulp.dest("tmp"))
          );

          return equalFileContents("gulp/**/*.js", "tmp", babel);
        }
      )
    );

    it(
      `equalFileContents returns a promise that rejects on inequality`,
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest("tmp"))
          );

          try {
            await equalFileContents("gulp/**/*.js", "tmp", babel);
          } catch (err) {
            expect(err.message).to.match(/expected .* to equal/);
          }
        }
      )
    );
  });

  describe(`Dest is outside the package directory tree`, (): void => {
    beforeEach(function(): void {
      this.dest = "/tmp/equalFileContents-test_" + new Date().getTime();
    });

    it(`equalFileContents returns a promise that resolves on equality`, async function(): Promise<
      boolean
    > {
      await streamToPromise(
        gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest(this.dest))
      );

      return equalFileContents("gulp/**/*.js", this.dest);
    });

    it(`equalFileContents returns a promise that rejects on inequality`, async function(): Promise<
      void
    > {
      await streamToPromise(
        gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest(this.dest))
      );

      try {
        await equalFileContents("gulp/**/*.js", this.dest, babel);
      } catch (err) {
        expect(err.message).to.match(/expected .* to equal/);
      }
    });
  });

  describe(`Dest is deeper inside the package directory tree`, (): void => {
    const base = "build_" + new Date().getTime();

    beforeEach(function(): void {
      this.src = path.join(base, "src");
      this.dest = path.join(base, "build");
    });

    it(
      `equalFileContents returns a promise that resolves on equality`,
      tmpDir(base, async function(): Promise<void> {
        // @ts-ignore
        const { src, dest }: { src: string; dest: string } = this;

        await streamToPromise(
          gulp.src("src/**/*.js", { base: cwd }).pipe(gulp.dest(base))
        );

        await streamToPromise(
          gulp.src(path.join(src, "**/*.js"), { base }).pipe(gulp.dest(dest))
        );

        await equalFileContents(
          path.join(src, "**/*.js"),
          dest,
          undefined,
          base
        );
      })
    );
  });

  describe("Testing with more than 16 files", (): void => {
    it(
      `equalFileContents returns a promise that resolves on equality`,
      tmpDir(
        "tmp",
        (): Promise<boolean> => {
          mkdirp.sync("tmp");
          for (let i = 0; i < 20; i++) {
            touch.sync("tmp/a" + i);
          }
          return equalFileContents("tmp/*", ".");
        }
      )
    );

    it(
      `equalFileContents returns a promise that rejects on inequality`,
      tmpDir(
        ["tmp", "tmp1"],
        async (): Promise<void> => {
          mkdirp.sync("tmp");
          mkdirp.sync("tmp1/tmp");

          for (let i = 0; i < 20; i++) {
            touch.sync("tmp/a" + i);
            touch.sync("tmp1/tmp/a" + i);
          }

          try {
            await equalFileContents(["tmp/*", "!tmp/a0"], "tmp1");
          } catch (err) {
            try {
              expect(err.toString()).to.match(
                /AssertionError: expected \{ Object.* to deeply equal \{ Object/
              );
            } catch (e) {
              throw err;
            }
          }
        }
      )
    );
  });
});
