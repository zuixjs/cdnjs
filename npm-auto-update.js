var path = require("path"),
    fs = require("fs-extra"),
    glob = require("glob"),
    _ = require('lodash'),
    request = require("superagent"),
    async = require("async"),
    tarball = require('tarball-extract'),
    mkdirp = require('mkdirp');

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

var isValidFileMap = function(pkg){
    var isValidPath = function(p){
        return p !== null && !p.match(/([\//]\.\.[\//])/); //don't allow parent dir access
    };

    if(pkg && pkg.npmFileMap){
        return _.every(pkg.npmFileMap, function(fileSpec){
           if(isValidPath(fileSpec.basePath || "")){
               return _.every(fileSpec.files, isValidPath);
           }
           return false;
        });
    }
    return false
};

var updateLibrary = function (pkg, callback) {
    if(!isValidFileMap(pkg)){
        console.log(pkg.npmName+" has a malicious npmFileMap, skipping!");
        return callback(null);
    }
    console.log('Checking versions for ' + pkg.npmName);
    request.get('http://registry.npmjs.org/' + pkg.npmName, function(result) {
        _.each(result.body.versions, function(data, version) {
            if(~pkg.name.indexOf("..")){
                console.log(pkg.npmName+" has a malicious package name, skipping! ", pkg.name);
                return;
            }
            var libPath = path.normalize(path.join(__dirname, 'ajax', 'libs', pkg.name, version));

            var isAllowedPath = function(){ //is path within the lib dir? if not, they shouldnt be writing/reading there
                var paths = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
                var re = new RegExp("^"+libPath)
                return _.every(paths, function(p) {
                    p = path.normalize(p);
                    return p.match(re);
                });
            };

            if(!fs.existsSync(libPath)) {
                console.log('dont have', version);
                fs.mkdirSync(libPath);
                var url = data.dist.tarball;
                var downloadFile = libPath + '/dist.tar.gz';
                tarball.extractTarballDownload(url , downloadFile, libPath, {}, function(err, result) {

                    fs.unlinkSync(downloadFile);
                    var folderName = fs.readdirSync(libPath)[0];
                    var newPkg = parse(path.join(libPath, folderName, 'package.json'));
                    if(isValidFileMap(newPkg)){
                        pkg.npmFileMap = newPkg.npmFileMap;
                    }
                    var npmFileMap = pkg.npmFileMap;

                    _.each(npmFileMap, function(fileSpec) {
                        var basePath = fileSpec.basePath || "";

                        _.each(fileSpec.files, function(file) {
                            var libContentsPath = path.normalize(path.join(libPath, folderName, basePath, file));
                            if(!isAllowedPath(libContentsPath)){
                                console.log(pkg.npmName+" contains a malicious file path, skipping: ", libContentsPath);
                            }
                            var files = glob.sync(libContentsPath);

                            _.each(files, function(extractFilePath) {
                                if(extractFilePath.match(/(dependencies|\.zip\s*$)/i)) return;

                                var replacePath = path.normalize(path.join(folderName, basePath));
                                var actualPath = extractFilePath.replace(replacePath, "");
                                if(!isAllowedPath(extractFilePath, actualPath)){
                                    console.log(pkg.npmName+" contains a malicious file path, skipping: ", extractFilePath, actualPath);
                                    return;
                                }
                                fs.renameSync(extractFilePath, actualPath);
                            });
                        });
                    });

                    fs.removeSync(path + '/' + folderName);
                });
                console.log("Do not have version", version, "of", pkg.npmName);
            }
        });
        var npmVersion = result.body['dist-tags'].latest;
        pkg.version = npmVersion;
        fs.writeFileSync('ajax/libs/' + pkg.name + '/package.json', JSON.stringify(pkg, null, 2), 'utf8');

        callback(null);
    });
}

console.log('Looking for npm enabled libraries...');

// load up those files
var packages = glob.sync("./ajax/libs/*/package.json");
packages = _(packages).map(function (pkg) {
    var parsedPkg = parse(pkg);
    return parsedPkg.npmName ? parsedPkg : null;
}).compact().value();

console.log('Found ' + packages.length + ' npm enabled libraries');

async.eachSeries(packages, updateLibrary, function(err) {
  console.log('Script completed');
});
