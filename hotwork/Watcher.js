'use strict';

const fs = require('fs');
const path = require('path');

const dirs = {};

const watch = (path, cb, scan) => {
	if (path.indexOf(".svn") > 0 || path.indexOf(".git") > 0) return;
	if (path.charAt(path.length - 1) !== '/') path += '/';
	if (!!dirs[path]) return;
	dirs[path] = true;
	if (!!path) {
		fs.watch(path, (event, name) => {
			if ((event === 'change' || event === "rename") && name.split(".").pop() == "js")
				cb(load(path, name, false, cb));
		});
	}
	if (scan) cb(load(path, false, scan, cb), scan);
	const files = fs.readdirSync(path);
	if (files.length === 0) return console.warn('路径为空，路径:', path);
	for (let i = 0, l = files.length; i < l; i++) {
		const fn = files[i];
		const fp = path + fn;
		if (isDir(fp)) this.watch(fp, cb);
	}
};
const load = (mpath, filename, scan, cb) => {
	if (!mpath) throw new Error('路径不应为空.');
	try { mpath = fs.realpathSync(mpath); } catch (err) { throw err; }
	if (!isDir(mpath)) throw new Error('路径必须是目录.');
	return loadPath(mpath, filename, scan, cb);
};
const loadPath = (path, filename, scan, cb) => {
	if (path.indexOf(".svn") > 0 || path.indexOf(".git") > 0) return;
	const files = fs.readdirSync(path);
	if (files.length === 0) return console.warn('路径为空，路径:', path);
	if (path.charAt(path.length - 1) !== '/') path += '/';
	const res = {};
	for (let i = 0, l = files.length; i < l; i++) {
		const fn = files[i];
		const fp = path + fn;

		if (!isFile(fp) || !checkFileType(fn, '.js')) {
			if (isDir(fp)) {
				if (!dirs[fp]) watch(fp, cb, true);
				if (scan) loadPath(fp, filename, scan, cb); //初次扫描，深层扫描
			}
			continue;
		}
		if (filename && getFileName(fn, 0) != filename) continue; //不是同一个文件不要浪费精力了
		const m = loadFile(fp, scan);
		if (!m) continue;
		const name = getFileName(fn, '.js'.length);
		res[name] = m;
	}
	return res;
};
const checkFileType = (fn, suffix) => {
	if (suffix.charAt(0) !== '.') suffix = '.' + suffix;
	if (fn.length <= suffix.length) return false;
	const str = fn.substring(fn.length - suffix.length).toLowerCase();
	suffix = suffix.toLowerCase();
	return str === suffix;
};
const isFile = (path) => { return fs.statSync(path).isFile(); };
const isDir = (path) => { return fs.statSync(path).isDirectory(); };
const getFileName = (fp, suffixLength) => {
	const fn = path.basename(fp);
	return fn.length > suffixLength ? fn.substring(0, fn.length - suffixLength) : fn;
};
const loadFile = (fp, scan) => { return requireUncached(fp, scan); };
const requireUncached = (module, scan) => {
	if (!scan) {
		const orgreq = require.cache[require.resolve(module)];
		delete require.cache[require.resolve(module)];
		if (!!orgreq) require.cache[require.resolve(module)] = orgreq;
	}
	return require(module);
};

exports.watch = watch;