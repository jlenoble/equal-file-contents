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
    it(`equalFileContents returns a promise that resolves true on equality`, async (): Promise<
      void
    > => {
      expect(await equalFileContents("gulp/**/*.js", ".")).to.be.true;
    });

    it(`equalFileContents returns a promise that resolves false on inequality`, async (): Promise<
      void
    > => {
      expect(await equalFileContents("gulp/**/*.js", "src")).to.be.false;
    });
  });

  describe(`Pipe is babel()`, (): void => {
    it(
      `equalFileContents returns a promise that resolves true on equality`,
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp
              .src("gulp/**/*.js", { base: cwd })
              .pipe(babel())
              .pipe(gulp.dest("tmp"))
          );

          expect(
            await equalFileContents("gulp/**/*.js", "tmp", { pipe: babel })
          ).to.be.true;
        }
      )
    );

    it(
      `equalFileContents returns a promise that resolves false on inequality`,
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest("tmp"))
          );

          expect(
            await equalFileContents("gulp/**/*.js", "tmp", { pipe: babel })
          ).to.be.false;
        }
      )
    );
  });

  describe(`Dest is outside the package directory tree`, (): void => {
    beforeEach(function(): void {
      this.dest = "/tmp/equalFileContents-test_" + new Date().getTime();
    });

    it(`equalFileContents returns a promise that resolves true on equality`, async function(): Promise<
      void
    > {
      await streamToPromise(
        gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest(this.dest))
      );

      expect(await equalFileContents("gulp/**/*.js", this.dest)).to.be.true;
    });

    it(`equalFileContents returns a promise that resolves false on inequality`, async function(): Promise<
      void
    > {
      await streamToPromise(
        gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest(this.dest))
      );

      expect(
        await equalFileContents("gulp/**/*.js", this.dest, { pipe: babel })
      ).to.be.false;
    });
  });

  describe(`Dest is deeper inside the package directory tree`, (): void => {
    const base = "build_" + new Date().getTime();

    beforeEach(function(): void {
      this.src = path.join(base, "gulp");
      this.dest = path.join(base, "build");
    });

    it(
      `equalFileContents returns a promise that resolves true on equality`,
      tmpDir(base, async function(): Promise<void> {
        // @ts-ignore
        const { src, dest }: { src: string; dest: string } = this;

        await streamToPromise(
          gulp.src("gulp/**/*.js", { base: cwd }).pipe(gulp.dest(base))
        );

        await streamToPromise(
          gulp.src(path.join(src, "**/*.js"), { base }).pipe(gulp.dest(dest))
        );

        expect(
          await equalFileContents(path.join(src, "**/*.js"), dest, { base })
        ).to.be.true;
      })
    );
  });

  describe("Testing with more than 16 files", (): void => {
    it(
      `equalFileContents returns a promise that resolves true on equality`,
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          mkdirp.sync("tmp");
          for (let i = 0; i < 20; i++) {
            touch.sync("tmp/a" + i);
          }
          expect(await equalFileContents("tmp/*", ".")).to.be.true;
        }
      )
    );

    it(
      `suppressing one file with matchGlob === true`,
      tmpDir(
        ["tmp", "tmp1"],
        async (): Promise<void> => {
          mkdirp.sync("tmp");
          mkdirp.sync("tmp1/tmp");

          for (let i = 0; i < 20; i++) {
            touch.sync("tmp/a" + i);
            touch.sync("tmp1/tmp/a" + i);
          }

          expect(
            await equalFileContents(["tmp/*", "!tmp/a0"], "tmp1", {
              matchGlob: true
            })
          ).to.be.true;
        }
      )
    );

    it(
      `suppressing one file with matchGlob === false`,
      tmpDir(
        ["tmp", "tmp1"],
        async (): Promise<void> => {
          mkdirp.sync("tmp");
          mkdirp.sync("tmp1/tmp");

          for (let i = 0; i < 20; i++) {
            touch.sync("tmp/a" + i);
            touch.sync("tmp1/tmp/a" + i);
          }

          expect(
            await equalFileContents(["tmp/*", "!tmp/a0"], "tmp1", {
              matchGlob: false
            })
          ).to.be.false;
        }
      )
    );
  });

  describe("Dealing with bad globs", (): void => {
    it(
      "Missing file badfile.js",
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp
              .src("gulp/**/*.js", { base: cwd })
              .pipe(babel())
              .pipe(gulp.dest("tmp"))
          );

          expect(
            await equalFileContents("gulp/badfile.js", "tmp", { pipe: babel })
          ).to.be.false;

          expect(
            await equalFileContents(["badfile.js", "gulp/*.js"], "tmp", {
              pipe: babel
            })
          ).to.be.false;
        }
      )
    );

    it(
      "Unresolving glob baddir/*.js",
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp
              .src("gulp/**/*.js", { base: cwd })
              .pipe(babel())
              .pipe(gulp.dest("tmp"))
          );

          expect(
            await equalFileContents(["baddir/*.js"], "tmp", { pipe: babel })
          ).to.be.false;

          expect(
            await equalFileContents(["baddir/*.js", "gulp/*.js"], "tmp", {
              pipe: babel
            })
          ).to.be.true;
        }
      )
    );

    it(
      "Empty glob []",
      tmpDir(
        "tmp",
        async (): Promise<void> => {
          await streamToPromise(
            gulp
              .src("gulp/**/*.js", { base: cwd })
              .pipe(babel())
              .pipe(gulp.dest("tmp"))
          );

          try {
            await equalFileContents([], "tmp", { pipe: babel });
          } catch (e) {
            expect(e.message).to.match(/Invalid glob argument/);
          }
        }
      )
    );
  });
});
