'use strict';

const util = require('util');
const watcher = require('./watcher');

const hotmap = {};
const beans = {};

const extend = () => {
	let target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, src, copy;

	if (util.isBoolean(target)) { deep = target; target = arguments[1] || {}; i = 2; }
	if (!util.isObject(target) && !util.isFunction(target))  target = {};
	if (length === i) { target = this; --i; }

	for (; i < length; i++) {
		if ((options = arguments[i]) != null) {
			for (let name in options) {
				src = target[name]; copy = options[name];
				if (target === copy) continue;

				if (deep && copy && (util.isObject(copy) || util.isArray(copy))) {
					let clone = src && (util.isObject(src) || util.isArray(src)) ? src : (util.isArray(copy) ? [] : {});
					target[name] = extend(deep, clone, copy);
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}
	return target;
};

const scanCallBack = (folderres, scan) => {
	for (let file in folderres) {
		const res = folderres[file];

		if (util.isFunction(res)) {
			const bean = { func: res };
			const tmpobj = new res();
			if (tmpobj.hasOwnProperty('$id')) bean.id = tmpobj['$id'];
			if (!bean.id) bean.id = file;

			if ((!!beans[bean.id]) && scan != true) {
				if (beans[bean.id] != file && res.beans.length == 1) {
					throw new Error('重复的文件:' + file + ', id:' + beans[bean.id]);
					return;
				}
			} else {
				beans[bean.id] = file;
			}
			const singleton = (tmpobj.hasOwnProperty('$scope') && tmpobj['$scope'] == 'singleton');

			if (!!hotmap[bean.id]) {
				if (scan) return;
				if (singleton != (!!hotmap[bean.id].singleton)) {
					throw new Error('单例文件已经改变:' + file + ', id:' + bean.id);
					return;
				}
				let protos = null, orgprotos = {};
				let org_func = hotmap[bean.id].func;
				if (!!org_func) {
					orgprotos = org_func.prototype;
				} else if (!!hotmap[bean.id].singleton) {
					orgprotos = hotmap[bean.id].singleton.__proto__;
				} else {
					continue;
				}

				protos = bean.func.prototype;
				try {
					if (!!protos) for (let func_name in protos) orgprotos[func_name] = protos[func_name];
					console.log('文件:', file, 'id:', bean.id, '热更成功!');
				} catch (e) {
					console.error('文件:', file, 'id:', bean.id, '热更失败!');
					console.error(e);
				}
			} else {
				hotmap[bean.id] = { id: bean.id, func: bean.func };
				if (singleton) hotmap[bean.id].singleton = tmpobj;
			}
		} else if (res.hasOwnProperty('beans')) {
			for (let i = 0; i < res.beans.length; i++) {
				const bean = res.beans[i];
				if (!bean.id) { throw new Error('文件:' + file + ',没有id!'); return; }
				if (!bean.func) { throw new Error('文件:' + file + ',没有func!'); return; }
				if ((!!beans[bean.id]) && scan != true) {
					if (beans[bean.id] != file && res.beans.length == 1) {
						throw new Error('重复的文件:' + file + ', id:' + beans[bean.id]);
						return;
					}
				} else {
					beans[bean.id] = file;
				}
				const singleton = (bean.hasOwnProperty('scope') && (bean.scope == 'singleton'));
				if (!!hotmap[bean.id]) {
					if (scan) return;
					if (singleton != (!!hotmap[bean.id].singleton)) {
						throw new Error('单例文件已经改变:' + file + ', id:' + bean.id);
						return;
					}
					let protos = null, orgprotos = {};
					let org_func = hotmap[bean.id].func;
					if (!!org_func) {
						orgprotos = org_func.prototype;
					} else if (!!hotmap[bean.id].singleton) {
						orgprotos = hotmap[bean.id].singleton.__proto__;
					} else {
						continue;
					}

					protos = bean.func.prototype;
					try {
						if (!!protos) for (let func_name in protos) orgprotos[func_name] = protos[func_name];
						console.log('文件:', file, 'id:', bean.id, '热更成功!');
					} catch (e) {
						console.error('文件:', file, 'id:', bean.id, '热更失败!');
						console.error(e);
					}
					if (singleton && bean.hasOwnProperty('runupdate')) hotmap[bean.id].singleton[bean.runupdate]();
				} else {
					hotmap[bean.id] = { id: bean.id, func: bean.func };
					if (singleton) hotmap[bean.id].singleton = new bean.func();
				}
			}
		} else {
			if (!!hotmap[file]) {
				if (scan) return;
				if (!!res['noUpdate']) return;
				if (!!res.reverse) {
					const org_res = hotmap[file].singleton;
					for (let key in res) {
						if (org_res.hasOwnProperty(key)) {
							res[key] = org_res[key];
						} else {
							org_res[key] = res[key];
						}
					}
					return;
				}
				if (!hotmap[file].singleton) throw new Error('热更文件没有数据:' + file);
				extend(true, hotmap[file].singleton, res);
			} else {
				hotmap[file] = { id: file, singleton: res };
			}
		}
	}
};

const scanFolder = (path) => { watcher.watch(path, scanCallBack, true); };
const getHot = (id, require, file) => {
	if (!hotmap.hasOwnProperty(id)) {
		if (!file) file = id;
		if (!require) throw new Error('没有热更文件：' + id);

		const res = {};
		res[file] = require;
		scanCallBack(res, true);
	}
	if (!hotmap.hasOwnProperty(id)) throw new Error('没有热更文件：' + id);

	const hot = hotmap[id];
	if (!!hot.singleton) return hot.singleton;
	return hot.func;
};

exports.scanFolder = scanFolder;
exports.getHot = getHot;