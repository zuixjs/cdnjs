# a temporary version of the contributing doc


## A. issue

* Before opening a issue ticket, please check if there is/was already exist a issue on the same topic.

* If you are going to open a issue about your lib(means you are the author/maintainer or one of the main authors/maintainers), please add `[author]` on the issue topic, we'll give it a higher priority to process.

* Please tag abiviously related people or issues or commits on the issue as cc(carbon copy).
 * For example, [@PeterDaveHello](https://github.com/PeterDaveHello) / [#3388](https://github.com/cdnjs/cdnjs/issues/3388) / [51e1bd713f](https://github.com/cdnjs/cdnjs/commit/51e1bd713fa31fec271bbbcf565131e77536bdf2)


## B. pull request

### a. common conventions

1. Before sending a pull request, please sync/update your own repository with our master head.

2. If you are **not** the author or maintainer of the lib, lease tell us where are those files from, like the url of its download page, or the url of releases page of the library.
* If you are the author or maintainer of the lib, please just add `[author]` in th pull request's title.

3. If it doesn't have officially minified files, please minify all of the main css/js files, and give them a file name as `library.min.js`.
* cdnjs's preferred JavaScript minifier is [UglifyJS](http://marijnhaverbeke.nl/uglifyjs "UglifyJS")
* You can also use [web-minify-helper](https://github.com/PeterDaveHello/web-minify-helper "web-minify-helper") to help you do this automatically, it supports both css and js.

4. Filenames should **not** include a version number and be **lowercase**.
* This is OK: `useful.min.js`, but this is not: `useful-2.0.1.min.js`.

5. Only do **one** thing or **strongly related** works in one commits, don't mix different things into the same commit.

6. Every commits should be meaningful, don't cut one thing into multiple commits, unless you are trying to fix the exist problem in the master branch.
* Like adding a lib, but it has some problem, so come with many commits to fix, that will not be allowed.

7. Do **not** do the things which is **not** related with your commit log.

8. We **only** host the css/js libs with **production** version, unless the project is very popular, like jQuery, this is for maintainer to decide.
* If you have a good reason to host a alpha/beta/RC or other non-production version, please feel free to explain in comments.

9. If you are asked to modify the commits, please use `git commit --amend`/`git rebase` to update your commits, and use `--force` parameter with git push to update the pull request.

### b. updating an exist library

1. Please try to maintain consistency with the existing file and directory structure.
* If you think the old tructure is **wrong**, or the structure obiviouslly changed in the new verion, please add notes in the commit log or pull request comment.

2. Please don't forget to update the version info in its `package.json`.

3. Make sure the main file, as known as the `filename` property in `package.json` is correct, different versions may use different filename.

### c. adding a new library

1. Libraries are stored in the ajax/libs directory. Each library has its own subdirectory of ajax/libs and each version of the library has its own subdirectory of the library directory name, for example:
 > /ajax/libs/jquery/2.0.0/

2. We use [`package.json`](https://www.npmjs.org/doc/package.json.html) to store the meta data of a library in [npm format](https://www.npmjs.org/doc/package.json.html), please don't forget to add this file at the root of the lib.
* If there is an official `package.json`, please try to follow the official version, the best way is just copy from the official and do a little modify on it.
* If there is **not** an official `package.json`, please **create** it by yourself, you should refer to [doc of package.json](https://www.npmjs.org/doc/package.json.html) orother lib's `package.json`, and the data should be as close as official data as possible.
 * If you will **create** its `package.json`, the indent of it **must** be `2 spaces`, others will be fine to follow official version or to use 2 spaces.

3. We use the directory/folder name and `name` property in `package.json` to identify a library, so this two string should be **totally** equal.

4. You **must** do `npm test` under the root directory of this project to make sure everything is fine.
* Please refer to [README](https://github.com/cdnjs/cdnjs/blob/master/README.md) file([Install npm test dependencies](https://github.com/cdnjs/cdnjs/blob/master/README.md#install-npm-test-dependencies) & [Run npm test to check all is well](https://github.com/cdnjs/cdnjs/blob/master/README.md#run-npm-test-to-check-all-is-well)).

### d. P.S.

1. Because of the characteristic of git, it'll be better to do the work on Unix-like environment, like linux or BSD distrobutions(not including Mac).

2. If you think this doc is too simple or casual, please refer to [README](https://github.com/cdnjs/cdnjs/blob/master/README.md) file or another detail version of [CONTRIBUTING-WIP](https://github.com/cdnjs/cdnjs/blob/master/CONTRIBUTING-WIP.md) doc.
* If there are some conflicts between these files, the priority should be like this: README > CONTRIBUTING > CONTRIBUTING-WIP, and you can help us to open a issue and discuss, fix it.

3. If the library has **official** npm package, please try to maintain it with [npm auto update](https://github.com/cdnjs/cdnjs#enabling-npm-auto-update).


Finally, thank you so much for your contribution, hope we can make the best cdn service on the world :)
