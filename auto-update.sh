#!/bin/bash
# Exit if any errors
set -e

echo Getting latest libraries
git pull

echo npm install for good mesure
npm install

echo Starting npm script
node auto-update.js

echo Pushing new versions
git add .
git commit -am "Updated packages via auto-update.js"
git push

