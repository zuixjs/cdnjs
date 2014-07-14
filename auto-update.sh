#!/bin/sh
# Exit if any errors
set -e
cd /root/cdnjs
echo Getting latest libraries

git add .
git commit -am "new auto update"
ls
git pull --rebase

echo npm install for good measure
/usr/local/bin/npm install
/usr/local/bin/npm install -g vows

echo Starting auto update script
/usr/local/bin/node auto-update.js run >> node.log

echo Starting npm test
/usr/local/bin/npm test

if [ "$?" != 0 ]; then
    echo Something wrong, force exit.
    exit 1
fi

echo Pushing new versionis if there is a real changing
git pull --rebase
git push
#if [ "`git diff -w`" != "" ]; then
#    git add .
#    git commit -am "Updated packages via auto-update.js"
#    git pull --rebase
#    git push
#fi
