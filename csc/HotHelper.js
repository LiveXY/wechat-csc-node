//热更
'use strict';

const hot = require('hotwork');

module.exports = {
	scan: hot.scan,
	get getConfig() { return hot.get('Config', require(__dirname + '/Config')); },
	get getTools() { return hot.get('Tools', require(__dirname + '/Tools')); },
	get getLog() { return hot.get('Log', require(__dirname + '/Log')); },
	get getWechatApi() { return hot.get('WechatApi', require(__dirname + '/WechatApi')); },
	get getWechatBot() { return hot.get('WechatBot', require(__dirname + '/WechatBot')); },
	get getWechatMsg() { return hot.get('WechatMsg', require(__dirname + '/WechatMsg')); },
	get getMessageRole() { return hot.get('MessageRole', require(__dirname + '/MessageRole')); }
};