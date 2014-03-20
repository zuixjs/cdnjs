#!/bin/sh

# Exit if any errors
set -e
cd /root/cdnjs
echo Getting latest libraries
git pull

echo npm install for good measure
npm install

echo Starting auto update script
node auto-update.js

echo Pushing new versions
git add .
git commit -am "Updated packages via auto-update.js"
git push

