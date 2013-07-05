#!/bin/bash
# Exit if any errors
set -e

git pull
git checkout zopfli
git merge master -m "test"

node zopfli.js

cd ..
git add .
git commit -am "zopfli"
git push
git checkout master
