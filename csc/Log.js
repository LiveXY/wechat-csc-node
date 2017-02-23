//控制台日志
'use strict';

function Log() { }
const log = Log.prototype;

//消息
log.info = function() {
	const args = Array.prototype.slice.call(arguments);
	args.splice(0, 0, new Date().format('yyyy-MM-dd HH:mm:ss'), '[INFO]');
	console.info.apply(null, args);
};

//警告
log.warn = function() {
	const args = Array.prototype.slice.call(arguments);
	args.splice(0, 0, new Date().format('yyyy-MM-dd HH:mm:ss'), '[WARN]');
	console.warn.apply(null, args);
};

//出错
log.error = function() {
	const args = Array.prototype.slice.call(arguments);
	args.splice(0, 0, new Date().format('yyyy-MM-dd HH:mm:ss'), '[ERRO]');
	console.error.apply(null, args);
};

module.exports = { beans: [{ id: "Log", func: Log, scope: "singleton" }] };