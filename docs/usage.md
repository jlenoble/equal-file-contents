## Usage !heading

### `equalFileContents(glob, dest, plugin)`

Takes a valid glob, a valid destination (string) and optionally a function returning a stream transform (typically bound Gulp plugins), and returns a promise that resolves if and only if transformed sources match one-to-one to those in the destination.

Unlike with a tool like [gulp-diff](https://www.npmjs.com/package/gulp-diff), more files in target directory are therefore not allowed. The comparison is exact.

### Example !heading

```js
import gulp from 'gulp';
import babel from 'gulp-babel';
import streamToPromise from 'stream-to-promise';
import equalFileContents from 'equal-file-contents';

streamToPromise(
  gulp.src('src/*.js')
  .pipe(babel())
  .pipe(gulp.dest('build')) // Make sure transpiled files exist on disc
).then(() => { // Now files are on disc, can be compared
  return equalFileContents('src/*.js', 'build', babel); // promise is resolved
})
```
