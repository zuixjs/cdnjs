var assert = require("assert");
var path = require("path");
var vows = require("vows-si");
var _ = require('lodash');

var reEscape = function(s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

var au = {
    invalidNpmName: function (name) {
      return (name.indexOf("..") !== -1); // doesnt contain
    },
    // is path within the lib dir? if not, they shouldnt be writing/reading there
    isAllowedPathFn: function(libPath) {
      libPath = path.normalize(libPath || "/");
      return function() {
        var paths = arguments.length >= 1 ? [].slice.call(arguments, 0) : [];
        var re = new RegExp("^" + reEscape(libPath));
        return _.every(paths, function(p) {
          p = path.normalize(p);
          return p.match(re);
        });
      };
    },
    /**
     * Check if an npmFileMap object contains any path which are not normalized, and thus could allow access to parent dirs
     * @param pkg
     * @returns {*}
     */
    isValidFileMap: function (pkg) {
      var isValidPath = function(p) {
        if (p !== null) { // don't allow parent dir access, or tricky paths
          p = p.replace(/\/+/g, '/'); // don't penalize for consequtive path seperators
          return p === path.normalize(p);
        }
        return false;
      };

      if (pkg && pkg.autoupdate && pkg.autoupdate.source === "npm" && pkg.autoupdate.fileMap) {
        return _.every(pkg.autoupdate.fileMap, function(fileSpec) {
          if (isValidPath(fileSpec.basePath || "/")) {
            return _.every(fileSpec.files, isValidPath);
          }
          return false;
        });
      }
      return false;
    }
};


var suite = vows.describe('NPM Auto Update - stand alone methods');
suite.addBatch({
  'npm name validation': {
    "topic": ["floatthead", "../evil"],
    'This is a valid npm name': function(arr) {
      assert.equal(au.invalidNpmName(arr[0]), false);
    },
    'This is an invalid npm name': function(arr) {
      assert.equal(au.invalidNpmName(arr[1]), true);
    }
  },
  'npmFileMap validation - simple': {
    "topic": {npmFileMap: [
      {
        basePath: "/dist/",
        files: [
          "*.js",
          "blee/blah//script.js",
          "blee/blah//script.min.js",
          "styles.css",
          "/test/**/*.*"
        ]
      }
    ]},
    'This is a valid npm file map': function(obj) {
      assert.equal(au.isValidFileMap(obj), true);
    },
    'file paths are ok too': function(obj) {
      var map = obj.npmFileMap[0];
      var testFn = au.isAllowedPathFn(path.join('someplace', map.basePath));
      assert.equal(testFn.apply(null, _.map(map.files, function(f) {
        return path.join("someplace", map.basePath, f);
      })), true);
    }
  },
  'npmFileMap validation - arrays': {
    "topic": {npmFileMap: [
      {
        basePath: "dist",
        files: [
          "*.js",
          "blee/blah//script.js",
          "blee/blah//script.min.js",
          "styles.css",
          "/test/**/*.*"
        ]
      },
      {
        basePath: "",
        files: [
          "test.css",
          "/blee.js",
          "this_is_ok_right_now.zip"
        ]
      },
      {
        basePath: "",
        files: [
          "*"
        ]
      }
    ]},
    'valid array of file maps': function(obj) {
      assert.equal(au.isValidFileMap(obj), true);
    },
    'these paths are ok too': function(obj) {
      var map = obj.npmFileMap[0];
      var testFn = au.isAllowedPathFn(path.join('someplace', map.basePath));
      assert.equal(testFn.apply(null, _.map(map.files, function(f) {
        return path.join("someplace", map.basePath, f);
      })), true);
    },
    'these paths are also allowed': function(obj) {
      var map = obj.npmFileMap[1];
      var testFn = au.isAllowedPathFn(path.join('someplace', map.basePath));
      assert.equal(testFn.apply(null, _.map(map.files, function(f) {
        return path.join("someplace", map.basePath, f);
      })), true);
    }

  },
  'npmFileMap validation - invalid 1': {
    "topic": {npmFileMap: [
      {
        basePath: "dist",
        files: [
          "*.js",
          "blee/blah/../../../script.js",
          "/../../../../../../../../../../etc/hosts",
          "styles.css",
          "/test/**/*.*"
        ]
      }
    ]},
    'this npm filemap is doing evil things': function(obj) {
      assert.equal(au.isValidFileMap(obj), false);
    },
    'these paths are bad': function(obj) {
      var map = obj.npmFileMap[0];
      var testFn = au.isAllowedPathFn(path.join('someplace', map.basePath));
      assert.equal(testFn.apply(null, _.map(map.files, function(f) {
        return path.join("someplace", map.basePath, f);
      })), false);
    }
  }
});
suite.export(module);
