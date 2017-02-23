//常用工具
'use strict';

const crypto = require('crypto');
const cp = require('child_process');

const hot = require("./HotHelper");
const config = hot.getConfig;

//日期format C#结构 yyyy-MM-dd HH:mm:ss
Date.prototype.format = function(fmt) {
	let o = { "M+": this.getMonth() + 1, "d+": this.getDate(), "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, "H+": this.getHours(), "m+": this.getMinutes(), "s+": this.getSeconds(), "q+": Math.floor((this.getMonth() + 3) / 3), "S": this.getMilliseconds() };
	let week = { "0": "\u65e5", "1": "\u4e00", "2": "\u4e8c", "3": "\u4e09", "4": "\u56db", "5": "\u4e94", "6": "\u516d" };
	if (/(y+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length)); };
	if (/(E+)/.test(fmt)) { fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "\u661f\u671f" : "\u5468") : "") + week[this.getDay() + ""]); };
	for (let k in o) { if (new RegExp("(" + k + ")").test(fmt)) { fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length))); }; };
	return fmt;
};
//字符format C#结构 "{0} is cat".format("QQ");
String.prototype.format = function(obj) {
	let formatted = this;
	if (arguments.length > 1 || (!tools.isObject(obj))) {
		for (let i = 0; i < arguments.length; i++) {
			let regexp = new RegExp('\\{' + i + '\\}', 'gi');
			formatted = formatted.replace(regexp, arguments[i]);
		}
	} else {
		for (let i in obj) {
			let regexp = new RegExp('\\{' + i + '\\}', 'gi');
			formatted = formatted.replace(regexp, obj[i]);
		}
	}
	return formatted;
};
//去前后空格
String.prototype.trim = function() {
	let str = this, whitespace = ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
	for (var i = 0,len = str.length; i < len; i++) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(i);
			break;
		}
	}
	for (i = str.length - 1; i >= 0; i--) {
		if (whitespace.indexOf(str.charAt(i)) === -1) {
			str = str.substring(0, i + 1);
			break;
		}
	}
	return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
};

function Tools() { }
const tools = Tools.prototype;

//MD5加密
tools.MD5 = (str) => {
	const md5sum = crypto.createHash('md5');
	md5sum.update(str, "utf8");
	str = md5sum.digest('hex');
	return str;
};
//秒时间戳 PHP结构
tools.getSystemSecond = () => { return Math.round(+new Date() / 1000); };
tools.getDateSecond = () => { return new Date().format('yyyyMMddHHmmss'); };

//对象类型
tools.isObject = (arg) => { return typeof arg === 'object' && arg !== null && Object.prototype.toString.call(arg) === '[object Object]'; }
//数组类型
tools.isArray = (ar) => { return Array.isArray(ar) || (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]'); }
//字符类型
tools.isString = (ar) => { return typeof ar === 'string'; };
//数字类型
tools.isNumber = (x) => {
	if (typeof x === 'number') return true;
	if (/^0x[0-9a-f]+$/i.test(x)) return true;
	return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
};
//扩展方法
tools.extend = () => {
	let target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

	if (typeof target === "boolean") { deep = target; target = arguments[1] || {}; i = 2; }
	if (typeof target !== "object" && typeof target !== 'function') target = {};
	if (length === i) { target = this; --i; }

	for (; i < length; i++) {
		if ((options = arguments[i]) != null) {
			for (name in options) {
				src = target[name]; copy = options[name];
				if (target === copy) continue;

				if (deep && copy && (this.isObject(copy) || this.isArray(copy))) {
					let clone = src && (this.isObject(src) || this.isArray(src)) ? src : this.isArray(copy) ? [] : {};
					target[name] = this.extend(deep, clone, copy);
				} else if (copy !== undefined) {
					target[name] = copy;
				}
			}
		}
	}
	return target;
};

tools.exec = (cmd, option) => {
	return new Promise(function(resolve, reject) {
		cp.exec(cmd, option, function(err, stdout, stderr) {
			resolve(err ? err.message : stdout);
		});
	});
};

tools.parseUserInfo = (userObj) => {
	let userInfo = {
	    userName: userObj.UserName,
	    nickName: userObj.NickName,
	    displayName: userObj.DisplayName,
	    remarkName: userObj.RemarkName,
	    contactFlag: userObj.ContactFlag,
	    sex: userObj.Sex,
	    signature: userObj.Signature,

	    searchPinyins: userObj.KeyWord + '|'
	        + userObj.PYInitia + '|'
	        + userObj.PYQuanPin + '|'
	        + userObj.RemarkPYInitial + '|'
	        + userObj.RemarkPYQuanPin + '|',

	    headImgUrl: 'https://wx.qq.com' + userObj.HeadImgUrl
	};
	return userInfo;
};
tools.getUserByUserName = (userName) => {
	if(userName === config.user.userName) return config.user;
	for(let i in config.contacts) {
		if (config.contacts[i].userName == userName) return config.contacts[i];
	}
	return null;
};
//启动计时器
tools.startWaitTimer = () => {
	if (!config.waiting) config.waitTimer = setInterval(() => { process.stdout.write("."); }, 1000);
	config.waiting = true;
};
//停止计时器
tools.stopWaitTimer = () => {
	clearInterval(config.waitTimer);
	config.waitTimer = null;
	config.waiting = false;
};
tools.resetSyncKey = (syncKey) => {
	if (!syncKey) return;
	if ((+syncKey.Count) <= 0) return;
	if (!syncKey.List || syncKey.List.length <= 0) return;
	config.auth.SyncKey = syncKey;
	config.flatSyncKey = '';
	for (let item of syncKey.List) {
		config.flatSyncKey += item.Key + '_' + item.Val + '%7C';
	}
	config.flatSyncKey = config.flatSyncKey.substring(0, config.flatSyncKey.length - 3);
};

module.exports = { beans: [{ id: "Tools", func: Tools, scope: "singleton" }] };