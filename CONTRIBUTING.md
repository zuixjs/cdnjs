# Contributing to cdnjs Library

**Please read this document before contributing to cdnjs - thank you.**

## 0.0 Overview

[cdnjs](http://github.com/cdnjs/cdnjs) is the GitHub repository mirroring all library assets on [cdnjs.cloudflare.com](http://cdnjs.cloudflare.com).

cdnjs relies on user-submitted pull requests and automatic updating to populate and update libraries. With hundreds of contributors and thousands of commits, it is very important that new libraries are added to cdnjs using the correct procedure.

Libraries that are actively-maintained on [npmjs](http://npmjs.org) can be configured to be _automatically_ updated. Other libraries that are not on npmjs should be updated _manually_.

## 1.0 Policy, rules and guidelines

cdnjs will host any production version of any JavaScript (JS) or Cascading Style Sheets (CSS) library, subject to appropriate licence permissions.

cdnjs will host JS, CSS, SWF and library image files. Note: cdnjs does not currently serve HTML or PHP files.

New libraries should have some indicator of popularity (e.g., GitHub stars or watchers) and purpose (e.g., a jQuery plugin to display images).

cdnjs maintainers and peer-reviewers need to know the origin of new libraries and updates (i.e., where you downloaded the files from).

## 2.0 Configure auto-update

### 2.1 Auto-update overview

Libraries that are actively-maintained on [npmjs](http://npmjs.org) can be configured to be automatically updated. A cdnjs auto-update script runs every 15 minutes to check for new library versions on npmjs.

Each cdnjs library has a `package.json` file. This file contains required and sometimes optional information about how the library works. Auto-update is configured in `package.json` alongside other library information.

### 2.3 Auto-update syntax

* `npmName` is the corresponding npmjs name
* `npmFileMap` is a list of files to copy from npmjs to cdnjs
* `basePath` is the path in the npmjs tarball; it will be ignored when files are copied to cdnjs
* `files` indicates the file(s) to copy and can be named (e.g., lodash.min.js) or wildcards (e.g., *.js).

### 2.3 Auto-update example

```
  "npmName": "lodash",
  "npmFileMap": [{
    "basePath": "/dist/",
    "files": [
      "*.js"
    ]
  }],
```

The example in 2.3. parses the `lodash` tarball, which has this structure:

```
|__dist
| |__lodash.compat.js
| |__lodash.compat.min.js
| |__lodash.js
| |__lodash.min.js
| |__lodash.underscore.js
| |__lodash.underscore.min.js
|__LICENSE.txt
|__lodash.js
|__package.json
|__README.md
```

The auto-update process will locate `dist` (specified in `basePath`) and copy *.js (specified in `files`) to cdnjs, removing the `dist` path. The resulting files in cdnjs will be: 

```
|__ajax
  |__libs
    |__lodash.js
      |__x.y.z
        |__lodash.compat.js
        |__lodash.compat.min.js
        |__lodash.js
        |__lodash.min.js
        |__lodash.underscore.js
        |__lodash.underscore.min.js
```

&hellip;where `x.y.z` is the library version number, extracted from the `package.json` on npmjs.

## 3. Update existing library with new version

Coming soon.

## 4. Create a new library

Coming soon.