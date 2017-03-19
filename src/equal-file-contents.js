import path from 'path';
import gulp from 'gulp';
import {noop} from 'gulp-util';
import destglob from 'destglob';
import streamToPromise from 'stream-to-promise';
import cached from 'gulp-cached';
import {expect} from 'chai';

let counter = 0;

export default function equalFileContents (glb, dest, pipe = noop,
  base = process.cwd()) {
  const stream1 = gulp.src(glb).pipe(pipe(), {base});
  const stream2 = gulp.src(destglob(glb, dest, base), {base});

  const cacheName = '__CACHE_' + (counter++) + '_';
  const cacheName1 = cacheName + 1;
  const cacheName2 = cacheName + 2;

  const p1 = streamToPromise(stream1.pipe(cached(cacheName1)))
    .then(() => cached.caches[cacheName1]);
  const p2 = streamToPromise(stream2.pipe(cached(cacheName2)))
    .then(() => cached.caches[cacheName2]);

  return Promise.all([p1, p2])
    .then(caches => {
      try {
        const [c1, c2] = caches;
        expect(Object.keys(c1).length).to.equal(Object.keys(c2).length);
        for (let key of Object.keys(c1)) {
          const [dst] = destglob(key, dest, base);
          expect(c1[key]).to.equal(c2[
            path.join(path.resolve(base), path.relative(base, dst))]);
        }
        delete cached.caches[cacheName1];
        delete cached.caches[cacheName2];
      } catch (e) {
        delete cached.caches[cacheName1];
        delete cached.caches[cacheName2];
        throw e;
      }
    });
}
