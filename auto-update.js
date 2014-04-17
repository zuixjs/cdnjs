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
hipchat.message('gray', 'Auto Update Started');
var newVersionCount = 0;
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
            //assert.ok(0, json_file + " failed to parse");
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

var error = function(msg, name){
    var err = new Error(msg);
    err.name = name;
    console.log(msg);
    hipchat.message('red', msg);
    return err;
}
error.PKG_NAME = 'BadPackageName'
error.FILE_PATH = 'BadFilePath'


var isAllowedPathFn = function(libPath){ //is path within the lib dir? if not, they shouldnt be writing/reading there
    return function(){
        var paths = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
        var re = new RegExp("^"+libPath)
        return _.every(paths, function(p) {
            p = path.normalize(p);
            return p.match(re);
        });
    }
};

var processNewVersion = function(pkg, libPath, folderName){
    var isAllowedPath = isAllowedPathFn(libPath);

    var newPkg = parse(path.join(libPath, folderName, 'package.json'));
    if(isValidFileMap(newPkg)){
        pkg.npmFileMap = newPkg.npmFileMap;
    }
    var npmFileMap = pkg.npmFileMap;
    var errors = [];

    _.each(npmFileMap, function(fileSpec) {
        var basePath = fileSpec.basePath || "";

        _.each(fileSpec.files, function(file) {
            var libContentsPath = path.normalize(path.join(libPath, folderName, basePath, file));
            if(!isAllowedPath(libContentsPath)){
                errors.push(error(pkg.npmName+" contains a malicious file path: "+libContentsPath, error.FILE_PATH));
                return
            }
            var files = glob.sync(libContentsPath);

            _.each(files, function(extractFilePath) {
                if(extractFilePath.match(/(dependencies|\.zip\s*$)/i)) return;

                var replacePath = path.normalize(path.join(folderName, basePath));
                var actualPath = extractFilePath.replace(replacePath, "");
                if(!isAllowedPath(extractFilePath, actualPath)){
                    errors.push(error(pkg.npmName+" contains a malicious file path: "+extractFilePath+' or '+actualPath, error.FILE_PATH));
                    return;
                }
                fs.renameSync(extractFilePath, actualPath);
            });
        });
    });
    return errors;
}

var updateLibraryVersion = function(pkg, tarballUrl, version, cb) {
    if(~pkg.name.indexOf("..")){
        return cb(error(pkg.npmName+" has a malicious package name:"+ pkg.name, error.PKG_NAME));
    }
    var libPath = path.normalize(path.join(__dirname, 'ajax', 'libs', pkg.name, version));


    if(!fs.existsSync(libPath)) {
        fs.mkdirSync(libPath);
        var url = tarballUrl;
        var downloadFile = libPath + '/dist.tar.gz';
        tarball.extractTarballDownload(url , downloadFile, libPath, {}, function(err, result) {

            fs.unlinkSync(downloadFile);
            var folderName = fs.readdirSync(libPath)[0];
            processNewVersion(pkg, libPath, folderName);

            fs.removeSync(path.join(libPath, folderName));

            newVersionCount++;
            console.log("Do not have version", version, "of", pkg.npmName);
            cb()
        });
    } else {
        cb()
    }
};
var updateLibrary = function (pkg, callback) {
    if(!isValidFileMap(pkg)){
        console.log(pkg.npmName+" has a malicious npmFileMap");
        hipchat.message('red', pkg.npmName+" has a malicious npmFileMap");
        return callback(null);
    }
    console.log('Checking versions for ' + pkg.npmName);
    request.get('http://registry.npmjs.org/' + pkg.npmName, function(result) {
        async.eachLimit(_.pairs(result.body.versions), 5, function(p, cb){ //extract 5 at a time
            var data = p[1];
            var version = p[0];
            updateLibraryVersion(pkg, data.dist.tarball, version, cb)
        }, function(err){
            var npmVersion = result.body['dist-tags'] && result.body['dist-tags'].latest || 0;
            pkg.version = npmVersion;
            fs.writeFileSync('ajax/libs/' + pkg.name + '/package.json', JSON.stringify(pkg, null, 2), 'utf8');

            callback(null);
        });
    });
}

console.log('Looking for npm enabled libraries...');

// load up those files
var packages = glob.sync("./ajax/libs/*/package.json");
packages = _(packages).map(function (pkg) {
    var parsedPkg = parse(pkg);
    return (parsedPkg.npmName && parsedPkg.npmFileMap) ? parsedPkg : null;
}).compact().value();
hipchat.message('green', 'Found ' + packages.length + ' npm enabled libraries');
console.log('Found ' + packages.length + ' npm enabled libraries');

async.eachSeries(packages, updateLibrary, function(err) {
  console.log('Script completed');
  hipchat.message('green', 'Auto Update Completed - ' + newVersionCount + ' versions were updated');
});
