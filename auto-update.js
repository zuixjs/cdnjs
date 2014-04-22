var Hipchat = require('node-hipchat');

var HC = new Hipchat(process.env.HIPCHAT);
var hipchat = {
    message: function(color, message) {
        if (process.env.HIPCHAT) {
            var params = {
                room: 165440,
                from: 'Auto Update',
                message: message,
                color: color,
                notify: 0
            };
            HC.postMessage(params, function(data) {});
        } else {
            console.log('No Hipchat API Key');
        }
    }
};
var path = require("path"),
    fs = require("fs-extra"),
    glob = require("glob"),
    _ = require('lodash'),
    request = require("superagent"),
    async = require("async"),
    tarball = require('tarball-extract'),
    mkdirp = require('mkdirp');

fs.mkdirParent = function(dirPath, mode, callback) {
    //Call the standard fs.mkdir
    fs.mkdir(dirPath, mode, function(error) {
        //When it fail in this way, do the custom steps
        if (error && error.errno === 34) {
            //Create all the parents recursively
            fs.mkdirParent(path.dirname(dirPath), mode, callback);
            //And then the directory
            fs.mkdirParent(dirPath, mode, callback);
        }
        //Manually run the callback since we used our own callback to do all these
        callback && callback(error);
    });
};

hipchat.message('gray', 'Auto Update Started');
var newVersionCount = 0;
var parse = function(json_file, ignore_missing, ignore_parse_fail) {
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
            //assert.ok(0, json_file + " failed to parse");
        }
        return null;
    }
}

var updateLibrary = function(pkg, callback) {
    console.log('Checking versions for ' + pkg.npmName);

    var versionUpdates = [];


    request.get('http://registry.npmjs.org/' + pkg.npmName, function(result) {
        _.each(result.body.versions, function(data, version) {
            var path = './ajax/libs/' + pkg.name + '/' + version;
            if (!fs.existsSync(path)) {
                console.log('Dont have this verison', path);

                versionUpdates.push(function(callback) {
                    fs.mkdirSync(path);
                    var url = data.dist.tarball;
                    var download_file = path + '/dist.tar.gz';
                    console.log('Downloading...');
                    try {
                        tarball.extractTarballDownload(url, download_file, path, {}, function(err, result) {
                            console.log('Downloaded');
                            fs.unlinkSync(download_file);
                            if (err) {
                                fs.removeSync(path + '/' + folderName);
                                console.log('critcal');
                                callback();
                                return false;
                            }
                            var folderName = fs.readdirSync(path)[0];

                            var npmFileMap = pkg.npmFileMap;

                            _.each(npmFileMap, function(fileSpec) {
                                var basePath = fileSpec.basePath || "";
                                console.log('looping through files');
                                _.each(fileSpec.files, function(file) {
                                    var extractPath = basePath + "/" + file;
                                    var files = glob.sync(path + "/" + folderName + "/" + basePath + "/" + file);

                                    _.each(files, function(extractFilePath) {
                                        if (extractFilePath.slice(-4) == ".zip") return;
                                        if (extractFilePath.indexOf("dependencies") !== -1) return;
                                        var replacePath = folderName + "/" + basePath + "/";
                                        replacePath = replacePath.replace(/\/\//g, "/");
                                        replacePath = replacePath.replace(/\/\//g, "/");
                                        var actualPath = extractFilePath.replace(replacePath, "");
                                        console.log('checking extract', replacePath);
                                        if (fs.existsSync(extractFilePath)) {
                                            var bla = actualPath;
                                            fs.mkdirParent(bla.substr(2, bla.lastIndexOf('/') - 1), function() {
                                                console.log('made dir', bla.substr(2, bla.lastIndexOf('/') - 1))
                                                fs.renameSync(extractFilePath, actualPath);
                                            })
                                        } else {
                                            console.log('ERRRRRORRRRRR', extractFilePath, actualPath);
                                        }
                                    });
                                });
                            });
                            console.log('fiinished');
                            setTimeout(function() {
                                fs.removeSync(path + '/' + folderName);
                                callback();
                            }, 200);
                        });
                    } catch (e) {
                        console.log('so erro rprone', e)
                    }

                });;
                newVersionCount++;
                console.log("Do not have version", version, "of", pkg.npmName);
            }
        });


        async.series(versionUpdates, function(err, results) {
            var npmVersion = result.body['dist-tags'] && result.body['dist-tags'].latest || 0;
            pkg.version = npmVersion;
            fs.writeFileSync('ajax/libs/' + pkg.name + '/package.json', JSON.stringify(pkg, null, 2), 'utf8');

            callback(null, pkg['npm-name']);
        });
    });
}

console.log('Looking for npm enabled libraries...');

// load up those files
var packages = glob.sync("./ajax/libs/**/package.json");
packages = _(packages).map(function(pkg) {
    var parsedPkg = parse(pkg);
    return parsedPkg.npmName ? parsedPkg : null;
}).compact().value();
hipchat.message('green', 'Found ' + packages.length + ' npm enabled libraries');
console.log('Found ' + packages.length + ' npm enabled libraries');
var libraryUpdates = [];
_.each(packages, function(pkg) {
    libraryUpdates.push(function(callback) {
        updateLibrary(pkg, callback);
    });;
});
async.series(libraryUpdates, function(err, results) {
    console.log('Script completed');
    hipchat.message('green', 'Auto Update Completed - ' + newVersionCount + ' versions were updated');
});
