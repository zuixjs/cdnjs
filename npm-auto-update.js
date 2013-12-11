var path = require("path"),
    fs = require("fs-extra"),
    glob = require("glob"),
    _ = require('lodash'),
    request = require("superagent"),
    async = require("async"),
    tarball = require('tarball-extract');

var parse = function (json_file, ignore_missing, ignore_parse_fail) {
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

var updateLibrary = function (pkg, callback) {
    console.log('Checking versions for ' + pkg['npm-name']);
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
                    _.each(files, function(file) {
                        var oldPath = path + '/' + folderName + '/' + file;
                        var newPath = path + '/' + file;
                        console.log(oldPath);
                        if(fs.existsSync(oldPath)) {
                            fs.renameSync(oldPath, newPath);
                        }
                    });

                    fs.removeSync(path + '/' + folderName);

                    console.log(err, result);
                });
                console.log("Do not have this version", version);
            } else {
                console.log("Have this version", version);
            }
            //console.log(data);
        });
        var npmVersion = result.body['dist-tags'].latest;
        pkg.version = npmVersion;
        fs.writeFileSync('ajax/libs/' + pkg.name + '/package.json', JSON.stringify(pkg, null, 4), 'utf8');

        callback(null, pkg['npm-name']);
    });
}

console.log('Looking for npm enabled libraries...');

// load up those files
var packages = glob.sync("./ajax/libs/**/package.json");
packages = _(packages).map(function (pkg) {
    var parsedPkg = parse(pkg);
    return parsedPkg['npm-name'] ? parsedPkg : null;
}).compact().value();

console.log('Found ' + packages.length + ' npm enabled libraries');
var libraryUpdates = [];
_.each(packages, function(pkg) {
    libraryUpdates.push(function (callback) {
      updateLibrary(pkg, callback);
    });;
});
async.series(libraryUpdates, function(err, results) {
  console.log('Script completed');
});

