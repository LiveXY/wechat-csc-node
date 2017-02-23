var fs = require('fs');
var path = require('path');

var monDirs = {};
var Loader = module.exports = {};

//loop to watch all
Loader.watch = function(path, cb, scan) {
	if (path.indexOf(".svn") > 0) return;
	if (path.charAt(path.length - 1) !== '/') {
		path += '/';
	}
	if (!!monDirs[path]) return;
	startWatch(path, cb);
	if (scan) {
		cb(this.load(path, false, scan, cb), scan);
	}
	var files = fs.readdirSync(path);
	if (files.length === 0) {
		console.warn('path is empty, path:' + path);
		return;
	}
	var fp, fn, m, res = {};
	for (var i = 0, l = files.length; i < l; i++) {
		fn = files[i];
		fp = path + fn;

		if (isDir(fp)) {
			this.watch(fp, cb);
		}
	}
};

function startWatch(path, cb) {
	if (path.charAt(path.length - 1) !== '/') {
		path += '/';
	}
	//不要重复监控
	if (!!monDirs[path]) {
		return;
	}
	monDirs[path] = true;
	if (!!path) {
		fs.watch(path, function(event, name) {
			if ((event === 'change' || event === "rename") && name.split(".").pop() == "js") {
				cb(Loader.load(path, name, false, cb));
			}
		});
	}
}

Loader.load = function(mpath, filename, scan, cb) {
	if (!mpath) {
		throw new Error('opts or opts.path should not be empty.');
	}
	try {
		mpath = fs.realpathSync(mpath);
	} catch (err) {
		throw err;
	}
	if (!isDir(mpath)) {
		throw new Error('path should be directory.');
	}
	return loadPath(mpath, filename, scan, cb);
};

var loadFile = function(fp, scan) {
	var m = requireUncached(fp, scan);
	if (!m) {
		return;
	}
	return m;
};

var loadPath = function(path, filename, scan, cb) {
	if (path.indexOf(".svn") > 0) return;
	var files = fs.readdirSync(path);
	if (files.length === 0) {
		console.warn('path is empty, path:' + path);
		return;
	}
	if (path.charAt(path.length - 1) !== '/') {
		path += '/';
	}
	var fp, fn, m, res = {};
	for (var i = 0, l = files.length; i < l; i++) {
		fn = files[i];
		fp = path + fn;

		if (!isFile(fp) || !checkFileType(fn, '.js')) {
			if (isDir(fp)) {
				if (!monDirs[fp]) {
					Loader.watch(fp, cb, true);
				}
				//初次扫描，深层扫描
				if (scan) {
					loadPath(fp, filename, scan, cb);
				}
			}
			// only load js file type
			continue;
		}
		//不是同一个文件不要浪费精力了
		if (filename && getFileName(fn, 0) != filename) {
			continue;
		}
		m = loadFile(fp, scan);
		if (!m) {
			continue;
		}
		var name = getFileName(fn, '.js'.length); // m.name ||
		res[name] = m;
	}
	return res;
};

//Check file suffix
var checkFileType = function(fn, suffix) {
	if (suffix.charAt(0) !== '.') {
		suffix = '.' + suffix;
	}
	if (fn.length <= suffix.length) {
		return false;
	}
	var str = fn.substring(fn.length - suffix.length).toLowerCase();
	suffix = suffix.toLowerCase();
	return str === suffix;
};

var isFile = function(path) {
	return fs.statSync(path).isFile();
};

var isDir = function(path) {
	return fs.statSync(path).isDirectory();
};

var getFileName = function(fp, suffixLength) {
	var fn = path.basename(fp);
	if (fn.length > suffixLength) {
		return fn.substring(0, fn.length - suffixLength);
	}
	return fn;
};

var requireUncached = function(module, scan) {
	if (!scan) {
		var orgreq = require.cache[require.resolve(module)];
		delete require.cache[require.resolve(module)];

	}
	var req = require(module);
	if ((!scan) && (!!orgreq)) {
		require.cache[require.resolve(module)] = orgreq;
	}
	return req;
};