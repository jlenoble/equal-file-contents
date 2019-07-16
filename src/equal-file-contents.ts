import path from "path";
import gulp from "gulp";
import through from "through2";
import { Transform } from "stream";
import destglob from "destglob";
import streamToPromise from "stream-to-promise";
import cached from "gulp-cached";
import { expect } from "chai";
import { error } from "explanation";

interface Cache {
  [key: string]: string;
}

let counter = 0;

function noop(): Transform {
  return through.obj();
}

export default async function equalFileContents(
  glb: string | string[],
  dest: string,
  { pipe = noop, base = process.cwd(), noCacheLimit = false } = {}
): Promise<boolean> {
  const stream1 = gulp.src(glb, { base }).pipe(pipe());
  const stream2 = gulp.src(destglob(glb, dest, base), { base });

  const cacheName = "__CACHE_EFC" + counter++ + "_";
  const cacheName1 = cacheName + 1;
  const cacheName2 = cacheName + 2;

  const clearCaches = (): void => {
    if (cached.caches[cacheName1]) {
      delete cached.caches[cacheName1];
    }
    if (cached.caches[cacheName2]) {
      delete cached.caches[cacheName2];
    }
  };

  const cacheNames = Object.keys(cached.caches);
  const nCaches = cacheNames.length;

  if (cached.caches[cacheName1] || cached.caches[cacheName2]) {
    error({
      message: "Caches already exist",
      explain: [
        ["Caches are one or both of:", [cacheName1, cacheName2]],
        "You probably run concurrently different versions of equalFileContents"
      ]
    });
  }

  if (nCaches > 30 && !noCacheLimit) {
    error({
      message: "Too many gulp-cached caches",
      explain: [
        ["Number of current caches:", nCaches],
        ["Names:", cacheNames],
        [
          "If you are fine with that, add in your code:",
          "equalFileContents.noCacheLimit = true"
        ],
        "You may also want to check this package is properly deduped"
      ]
    });
  }

  const clearCachesAndThrow = (err: Error): void => {
    clearCaches();
    throw err;
  };

  try {
    await Promise.all([
      streamToPromise(stream1.pipe(cached(cacheName1))),
      streamToPromise(stream2.pipe(cached(cacheName2)))
    ]);

    const c1: Cache = cached.caches[cacheName1];
    const c2: Cache = cached.caches[cacheName2];

    expect(Object.keys(c1).length).to.equal(Object.keys(c2).length);

    for (const key of Object.keys(c1)) {
      const [dst] = destglob(key, dest, base);
      expect(c1[key]).to.equal(
        c2[path.join(path.resolve(base), path.relative(base, dst))]
      );
    }

    clearCaches();
  } catch (e) {
    clearCachesAndThrow(e);
  }

  return true;
}
