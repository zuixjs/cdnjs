#!/bin/sh
# Exit if any errors
set -e
cd /root/cdnjs
echo Getting latest libraries

git add .
git commit -am "new auto update"
ls
git pull

echo npm install for good measure
/usr/local/bin/npm install

echo Starting auto update script
/usr/local/bin/node auto-update.js run >> node.log

echo Pushing new versionis if there is a real changing
if [ "`git diff -w`" != "" ]; then
    git add .
    git commit -am "Updated packages via auto-update.js"
    git pull --rebase
    git push
fi
