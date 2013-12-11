"use strict";

var assert = require("assert"),
    path = require("path"),
    fs = require("fs-extra"),
    glob = require("glob"),
    jsv = require("JSV").JSV.createEnvironment(),
    _ = require('lodash'),
    npm = require("npm"),
    request = require("superagent"),
    tarball = require('tarball-extract');

function parse(json_file, ignore_missing, ignore_parse_fail) {
    var content;

    try {
        content = fs.readFileSync(json_file, 'utf8');
    } catch (err1) {
        if (!ignore_missing) {
            assert.ok(0, json_file + " doesn't exist!");
        }
        return null;
    }
    try {
        return JSON.parse(content);
    } catch (err2) {
        if (!ignore_parse_fail) {
            assert.ok(0, json_file + " failed to parse");
        }
        return null;
    }
}

// load up those files
var packages = glob.sync("./ajax/libs/**/package.json");
packages = _(packages).map(function (pkg) {
    var parsedPkg = parse(pkg);
    return parsedPkg['npm-name'] ? parsedPkg : null;
}).compact().value();


_.each(packages, function(pkg) {
    request.get('http://registry.npmjs.org/' + pkg['npm-name'], function(result) {
        //console.log(result.body);
        _.each(result.body.versions, function(data, version) {
            var path = './ajax/libs/' + pkg.name + '/' + version;
            if(!fs.existsSync(path)) {
                fs.mkdirSync(path);
                var url = data.dist.tarball;
                var download_file = path + '/dist.tar.gz';
                tarball.extractTarballDownload(url , download_file, path, {}, function(err, result) {
                    fs.unlinkSync(download_file);
                    var folderName = fs.readdirSync(path)[0];
                    console.log(folderName);

                    var files = data.files || [];
                    files = _.compact(files);
                    files.push(data.main);
                    _.each(files, function(file) {
                        var oldPath = path + '/' + folderName + '/' + file;
                        var newPath = path + '/' + file;
                        fs.renameSync(oldPath, newPath);
                    });

                    fs.removeSync(path + '/' + folderName);

                    console.log(err, result);
                });
                console.log("do not have this file");
            } else {
                console.log("We already have this...")
            }
            //console.log(data);
        })
    });
});


//console.log(packages);