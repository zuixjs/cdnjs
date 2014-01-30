<a href="http://travis-ci.org/cdnjs/cdnjs"><img src="https://secure.travis-ci.org/cdnjs/cdnjs.png" alt="Build Status" style="max-width:100%;"></a>

# cdnJS Script Repository

cdnJS is the repository mirroring all scripts on `cdnjs.cloudflare.com`, created and maintained by [Thomas Davis](https://twitter.com/neutralthoughts), [Ryan Kirkman](https://twitter.com/ryan_kirkman) and [Lachlan Collins](http://plus.google.com/116251728973496544370?prsrc=3)

We will host any version of any library. Feel free to add a pull request for an older version of a library if your site still uses it.

__Libraries must have notable popularity. 100 stars on GitHub is a good example, but as long as reasonably popularity can be demonstrated the library will be added.__

## Extensions, Plugins, Resources

[Extensions, Plugins, Resources](https://github.com/cdnjs/cdnjs/wiki/Extensions%2C-Plugins%2C-Resources)

## Conventions

* Filenames should **not** include version number and be **lowercase**
* JavaScript & CSS files should be minified. If the library doesn't already provide a minified version, our preferred minifier is [UglifyJS](http://marijnhaverbeke.nl/uglifyjs "UglifyJS")
* If you are updating an existing library, try to keep consistent with the existing structure

## Pull request steps

1. Fork this repository
  * Install all the needed dependencies locally (you will need `node`): `npm install`
2. Add your library (following the conventions of this repository)
  * 1 commit per pull request
  * 1 library per pull request
  * The files in the pull request must correspond to a tag in the original repository (some exceptions apply)
  * include a `package.json` in the NPM format (see `test/schemata/npm-package.json` for details - it's very simple)
  * Run `npm test` to check everything is OK
3. Send us your pull request
  * If you are the author of the library, add `[author]` to the pull request title
  * Make sure you include in the pull description:
      1. Where you downloaded the script
      2. If it isn't clear, how you found the version of the script
  * e.g. https://github.com/cdnjs/cdnjs/pull/541
4. If the library doesn't already provide a minified version, our preferred minifier is [UglifyJS](http://marijnhaverbeke.nl/uglifyjs "UglifyJS")

## Enabling NPM auto update

cdnJS automatically updates libraries that are known to be hosted on NPM e.g. Lodash. This script runs automatically every 4 hours

1. Update the `package.json` with configuration details for the library and submit your pull request. An example configuration:

```
 // Lodash package.json
 // ...
  "npmName": "lodash",
  "npmFileMap": [{
    "basePath": "/dist/",
    "files": [
      "*"
    ]
  }],
  // ...
```

* `npmName` should map to the name of the library on NPM
* `npmFileMap` is a white list of files to take from the NPM tarball and host on the CDN
* `basePath` will be ignored when copying over to the CDN
* `files` is a pattern matcher allowing selection of multiple files

The above example looks in the tarball whose structure might look like this:

```
- dist/lodash.js
- dist/lodash.min.js
- README
```

It will look for `dist/*` inside the tarball and locate the two listed files. It will copy the listed files over to cdnJS, minus the `dist` path. The resulting files in cdnJS will be: 

```
ajax/libs/lodash.js/1.0.0/lodash.js
ajax/libs/lodash.js/1.0.0/lodash.min.js
```

## Running the validator
1. Install all the needed dependencies locally (you will need `node`): `npm install`
2. Run the test suite: `npm test`
