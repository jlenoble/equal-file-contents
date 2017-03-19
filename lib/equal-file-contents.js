'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.default = equalFileContents;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var _gulpUtil = require('gulp-util');

var _destglob3 = require('destglob');

var _destglob4 = _interopRequireDefault(_destglob3);

var _streamToPromise = require('stream-to-promise');

var _streamToPromise2 = _interopRequireDefault(_streamToPromise);

var _gulpCached = require('gulp-cached');

var _gulpCached2 = _interopRequireDefault(_gulpCached);

var _chai = require('chai');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var counter = 0;

function equalFileContents(glb, dest) {
  var pipe = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _gulpUtil.noop;
  var base = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : process.cwd();

  var stream1 = _gulp2.default.src(glb).pipe(pipe(), { base: base });
  var stream2 = _gulp2.default.src((0, _destglob4.default)(glb, dest, base), { base: base });

  var cacheName = '__CACHE_' + counter++ + '_';
  var cacheName1 = cacheName + 1;
  var cacheName2 = cacheName + 2;

  var p1 = (0, _streamToPromise2.default)(stream1.pipe((0, _gulpCached2.default)(cacheName1))).then(function () {
    return _gulpCached2.default.caches[cacheName1];
  });
  var p2 = (0, _streamToPromise2.default)(stream2.pipe((0, _gulpCached2.default)(cacheName2))).then(function () {
    return _gulpCached2.default.caches[cacheName2];
  });

  return Promise.all([p1, p2]).then(function (caches) {
    try {
      var _caches = _slicedToArray(caches, 2),
          c1 = _caches[0],
          c2 = _caches[1];

      (0, _chai.expect)(Object.keys(c1).length).to.equal(Object.keys(c2).length);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(c1)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          var _destglob = (0, _destglob4.default)(key, dest, base),
              _destglob2 = _slicedToArray(_destglob, 1),
              dst = _destglob2[0];

          (0, _chai.expect)(c1[key]).to.equal(c2[_path2.default.join(_path2.default.resolve(base), _path2.default.relative(base, dst))]);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      delete _gulpCached2.default.caches[cacheName1];
      delete _gulpCached2.default.caches[cacheName2];
    } catch (e) {
      delete _gulpCached2.default.caches[cacheName1];
      delete _gulpCached2.default.caches[cacheName2];
      throw e;
    }
  });
}
module.exports = exports['default'];