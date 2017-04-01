//微信客服
'use strict';

const memwatch = require('memwatch-next');
const heapdump = require('heapdump');

const hot = require('./csc/HotHelper');
const bot = hot.getWechatBot;
const log = hot.getLog;

//泄漏检测
const leakwatch = () => {
	memwatch.on('leak', info => {
		heapdump.writeSnapshot(__dirname + '/logs/' + Date.now() + '.heapsnapshot');
		log.error('泄漏检测', JSON.stringify(info));
	});
};

hot.scan('./csc'); //csc目录自动热更新
bot.start(); //启动机器人

setTimeout(leakwatch, 2000);