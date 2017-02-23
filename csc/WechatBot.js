//微信机器人
'use strict';

const async = require('async');

const hot = require("./HotHelper");
const api = hot.getWechatApi;
const config = hot.getConfig;
const log = hot.getLog;
const tools = hot.getTools;
const wxmsg = hot.getWechatMsg;

function WechatBot() { }
const bot = WechatBot.prototype;

//初始化
bot.init = () => { wxmsg.init(bot); };
//启动
bot.start = () => {
	bot.init();
	async.series([
		cb => bot.fetchUUID(cb),
		cb => bot.checkScan(cb),
		cb => bot.checkLogin(cb),
		cb => bot.fetchUserAuth(cb),
		cb => bot.fetchUserInfo(cb),
		cb => bot.fetchContact(cb),
		cb => bot.fetchMsg(cb)
	], (err, results) => {
		if (err) {
			log.error('启动错误: ', err);
			process.kill();
		}
		log.info('启动成功！');
	});
};

//发送文本消息
bot.sendTextMsg = (toUserName, msg, cb) => {
	api.SendTextMsg(toUserName, msg, (err, json) => {
		let retCode = -1;
		let msg = null;
		if (json) {
			retCode = json.BaseResponse.Ret;
			msg = json.BaseResponse.ErrMsg;
			if(!msg && msg.length == 0) msg = null;
		}
		cb (err || msg || (retCode == 0 ? null : 'retCode: ' + retCode), retCode);
	});
};
//所有人发消息
bot.sendAllTextMsg = (msg, cb) => {
	const sendNext = i => {
		if (i > config.contacts.length) return cb();
		const u = config.contacts[i];
		if (u.userName.indexOf('@@') == 0) return sendNext(i++);
		setTimeout(() => {
			bot.sendTextMsg(u.userName, msg, (err) => {
				if (err) log.error('发送', u.nickName, '失败！'); else log.info('发送', u.nickName, '成功！');
				sendNext(i++);
			});
		}, 1000);
	};
	sendNext(0);
};
//获取消息内容
bot.fetchMsgContent = (cb) => {
	api.FetchMsgContent((err, json) => {
		if (!err) {
			tools.resetSyncKey(json.SyncKey);
			if(json && json.AddMsgCount > 0 && json.AddMsgList && json.AddMsgList.length > 0) {
				json.AddMsgList.forEach(msg => {
					let userInfo = tools.getUserByUserName(msg.FromUserName);
					wxmsg.putMsg(userInfo, msg);
				});
			}
		}
		cb();
	});
};
//检测消息
bot.fetchMsg = (cb) => {
	api.FetchMsg((err, text) => {
		if (err) {
			setTimeout(() => bot.fetchMsg(), 500);
			return;
		}
		let needToFetchMsg = true;
		if (text.indexOf('window.synccheck=') == 0) {
			needToFetchMsg = false;
			let retCode = +text.split('retcode:"')[1].split('"')[0];
			let selector = +text.split('selector:"')[1].split('"')[0];
			if (retCode === 0 && selector != 0) {
				bot.fetchMsgContent(() => bot.fetchMsg());
			} else if (retCode == 1100) {
				log.error('微信退出！text:', text, ', retCode:', retCode, ', selector:' + selector);
			} else if (retCode == 1101) {
				log.error('微信在其它地方登录！text:', text, ', retCode:', retCode, ', selector:' + selector);
				//setTimeout(() => bot.fetchUUID(cb), 1000);
			} else {
				needToFetchMsg = true;
			}
		}
		if (needToFetchMsg) setTimeout(() => bot.fetchMsg(cb), 500);
	});
};
//获取联系人
bot.fetchContact = (cb) => {
	if (!config.auth || !config.auth.ticket) return cb(null);
	api.FetchContact((err, contacts) => {
		if (!err) log.info('获取联系人：', contacts.length, '个');
		cb(null);
	});
};
//获取用户信息
bot.fetchUserInfo = (cb) => {
	api.FetchUserInfo((err, json) => {
		if (json) {
			config.user = tools.parseUserInfo(json.User);
			config.auth.SKey = json.SKey;
			tools.resetSyncKey(json.SyncKey);
			log.info('获取用户信息：', JSON.stringify(config.user));
		}
		cb(err);
	})
};
//获取用户授权
bot.fetchUserAuth = (cb) => {
	api.FetchUserAuth((err, cookies) => {
		if (!err && cookies) {
			config.auth = {
				uin: cookies.match(/wxuin=.+?;/)[0].split(/[=;]/)[1],
				ticket: cookies.match(/webwx_data_ticket=.+?;/)[0].split(/[=;]/)[1],
				sid: cookies.match(/wxsid=.+?;/)[0].split(/[=;]/)[1],
				loadtime: cookies.match(/wxloadtime=.+?;/)[0].split(/[=;]/)[1],
				uvid: cookies.match(/webwxuvid=.+?;/)[0].split(/[=;]/)[1],
				lang: cookies.match(/mm_lang=.+?;/)[0].split(/[=;]/)[1]
			};
			config.auth.cookie = 'wxuin=' + config.auth.uin + '; wxsid=' + config.auth.sid + '; wxloadtime=' + config.auth.loadtime + '; mm_lang=' + config.auth.lang + '; webwx_data_ticket=' + config.auth.ticket + '; webwxuvid=' + config.auth.uvid;
		}
		cb(err);
	});
};
//检测微信登录
bot.checkLogin = (cb) => {
	tools.startWaitTimer();
	log.info('正在登录微信...');
	api.CheckLogin((err, text) => {
		if (!err && text && text.indexOf('window.code=200;') >= 0 && text.indexOf('window.redirect_uri') >= 0) {
			tools.stopWaitTimer();
			config.redirectUrl = text.split('"')[1];
			config.baseUrl = config.redirectUrl.substring(0, config.redirectUrl.lastIndexOf("/"));
			console.log('');log.info('微信登录成功！');
			cb(null);
		} else {
			setTimeout(() => bot.checkLogin(cb), 500);
		}
	});
};
//检测扫描二维码
bot.checkScan = (cb) => {
	tools.startWaitTimer();
	log.info('等待扫描二维码...');
	api.CheckScan((err, text) => {
		if (!err && text && text.indexOf('window.code=201;') >= 0) {
			tools.stopWaitTimer();
			console.log('');log.info('扫描二维码完成！');
			cb(null);
		} else {
			setTimeout(() => bot.checkScan(cb), 500);
		}
	});
};
//获取UUID
bot.fetchUUID = (cb) => {
	api.FetchUUID((err, text) => {
		if (!err) {
			config.uuid = text.split('"')[1];
			log.info('打开扫描二维码登录微信：', config.QRCodeUrl.format(config.uuid));
			tools.exec('open ' + config.QRCodeUrl.format(config.uuid));
		}
		cb(err);
	});
};

module.exports = { beans: [{ id: "WechatBot", func: WechatBot, runupdate: 'init', scope: "singleton" }] };