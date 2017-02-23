String.prototype.format = function () { var args = arguments; return this.replace(/{(\d+)}/g, function () { return args[arguments[1]]; }); };

function scanFolder(path) {
	require("./Watcher").watch(path, scanCallBack, true);
}

var hotmap = {};
var file_bean_sort = {};

function isObject(arg) { return typeof arg === 'object' && arg !== null && Object.prototype.toString.call(arg) === '[object Object]'; }
function isArray(ar) { return Array.isArray(ar) || (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]'); }

function extend () {
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

	if (typeof target === "boolean") { deep = target; target = arguments[1] || {}; i = 2; }
	if (typeof target !== "object" && typeof target !== 'function')  target = {};
	if (length === i) { target = this; --i; }

	for (; i < length; i++) {
		if ((options = arguments[i]) != null) {
			for (name in options) {
				src = target[name]; copy = options[name];
				if (target === copy) continue;

				if (deep && copy && (isObject(copy) || isArray(copy))) {
					var clone = src && (isObject(src) || isArray(src)) ? src : isArray(copy) ? [] : {};
					target[name] = extend(deep, clone, copy);
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}
	return target;
}

function scanCallBack(folderres, scan) {
	for (var file in folderres) {
		var res = folderres[file];

		if (typeof res == "function") {
			var bean = { func: res };
			var tmpobj = new res();
			if (tmpobj.hasOwnProperty("$id")) bean.id = tmpobj.$id;
			if (!bean.id) bean.id = file;

			if ((!!file_bean_sort[bean.id]) && scan != true) {
				if (file_bean_sort[bean.id] != file && res.beans.length == 1) {
					throw new Error("Duplcate ID with files:" + file + " and " + file_bean_sort[bean.id]);
					return;
				}
			} else {
				file_bean_sort[bean.id] = file;
			}
			var singleton = (tmpobj.hasOwnProperty("$scope") && tmpobj.$scope == "singleton");

			if (!!hotmap[bean.id]) {
				if (scan) return;
				if (singleton != (!!hotmap[bean.id].singleton)) {
					throw new Error("singleton has changed in :" + file + "_" + bean.id);
					return;
				}
				var protos = null, orgprotos = {};
				var org_func = hotmap[bean.id].func;
				if (!!org_func) {
					orgprotos = org_func.prototype;
				} else if (!!hotmap[bean.id].singleton) {
					orgprotos = hotmap[bean.id].singleton.__proto__;
				} else {
					continue;
				}

				protos = bean.func.prototype;
				try {
					if (!!protos) for (var func_name in protos) orgprotos[func_name] = protos[func_name];
					console.log("file: {0} id: {1}  success update!".format(file, bean.id))
				} catch (e) {
					console.error("file: {0} id: {1}  fail!!!! update!".format(file, bean.id))
					console.error(e);
				}
			} else {
				hotmap[bean.id] = { id: bean.id, func: bean.func };
				if (singleton) hotmap[bean.id].singleton = tmpobj;
				//console.log(JSON.stringify(hotmap[bean.id]));
			}
		} else if (res.hasOwnProperty("beans")) {
			for (var i = 0; i < res.beans.length; i++) {
				var bean = res.beans[i];
				if (!bean.id) {
					throw new Error("file:" + file + ",has no bean id!");
					return;
				}
				if (!bean.func) {
					throw new Error("file:" + file + ",has no bean func!");
					return;
				}
				if ((!!file_bean_sort[bean.id]) && scan != true) {
					if (file_bean_sort[bean.id] != file && res.beans.length == 1) {
						throw new Error("Duplcate ID with files:" + file + " and " + file_bean_sort[bean.id]);
						return;
					}
				} else {
					file_bean_sort[bean.id] = file;
				}
				var singleton = (bean.hasOwnProperty("scope") && (bean.scope == "singleton"));
				if (!!hotmap[bean.id]) {
					if (scan) return;
					if (singleton != (!!hotmap[bean.id].singleton)) {
						throw new Error("singleton has changed in :" + file + "_" + bean.id);
						return;
					}
					var protos = null, orgprotos = {};
					var org_func = hotmap[bean.id].func;
					if (!!org_func) {
						orgprotos = org_func.prototype;
					} else if (!!hotmap[bean.id].singleton) {
						orgprotos = hotmap[bean.id].singleton.__proto__;
					} else {
						continue;
					}

					protos = bean.func.prototype;
					try {
						if (!!protos) for (var func_name in protos) orgprotos[func_name] = protos[func_name];
						console.log("file: {0} id: {1}  success update!".format(file, bean.id))
					} catch (e) {
						console.error("file: {0} id: {1}".format(file, bean.id))
						console.error(e);
					}
					if (singleton && bean.hasOwnProperty("runupdate")) hotmap[bean.id].singleton[bean.runupdate]();
				} else {
					hotmap[bean.id] = { id: bean.id, func: bean.func };
					if (singleton) hotmap[bean.id].singleton = new bean.func();
				}
			}
		} else {
			if (!!hotmap[file]) {
				if (scan) return;
				if (!!res.noUpdate) return;
				if (!!res.reverse) {
					var org_res = hotmap[file].singleton;
					for (var key in res) {
						if (org_res.hasOwnProperty(key)) {
							res[key] = org_res[key];
						} else {
							org_res[key] = res[key];
						}
					}
					return;
				}

				if (!hotmap[file].singleton) throw new Error("no data in hot file:" + file);
				extend(true, hotmap[file].singleton, res);
			} else {
				hotmap[file] = { id: file, singleton: res };
			}
		}
	}
}

exports.scanFolder = scanFolder;
exports.getHot = function(id, require, file) {
	if (!hotmap.hasOwnProperty(id)) {
		if (!file) file = id;
		if (!require) throw new Error("no hot file " + id + " no path");

		var res = {};
		res[file] = require;
		scanCallBack(res, true);
	}
	if (!hotmap.hasOwnProperty(id)) throw new Error("no hot file :" + id);

	var hot = hotmap[id];
	if (!!hot.singleton) return hot.singleton;
	return hot.func;
};