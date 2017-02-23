//微信API
'use strict';

const url = require('url');
const https = require('https');
const superagent = require('superagent');

const hot = require("./HotHelper");
const config = hot.getConfig;
const tools = hot.getTools;
const log = hot.getLog;

function WechatApi() { }
const api = WechatApi.prototype;

//发送文本消息
api.SendTextMsg = (toUserName, msg, cb) => {
	let clientMsgId = new Date().valueOf() + Math.floor(Math.random() * 8999 + 100);
	let data = {
		BaseRequest: {
			Uin: config.auth.uin,
			Sid: config.auth.sid,
			Skey: config.auth.SKey,
			DeviceID: config.auth.deviceId
		},
		Msg: {
			Type: 1,
			Content: msg,
			FromUserName: config.user.userName,
			ToUserName: toUserName,
			LocalID: clientMsgId,
			ClientMsgId: clientMsgId
		}
	};
	let url = config.baseUrl + '/webwxsendmsg?pass_ticket=' + config.auth.ticket;
	superagent.post(url)
		.set('Cookie', config.auth.cookie || '')
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.send(data)
		.end(function(err, res) {
			let json = null;
			if (err) {
				log.error('发送文本消息出错: ', err);
			} else if(!res || !res.text) {
				err = new Error('无返回数据');
				log.error('发送文本消息出错: ', err);
			} else {
				json = JSON.parse(res.text);
			}
			cb(err, json);
		});
};
//获取消息内容
api.FetchMsgContent = (cb) => {
	let url = config.baseUrl + '/webwxsync?sid=' + config.auth.sid + '&lang=zh_CN&skey=' + config.auth.SKey + '&r=' + tools.getSystemSecond() + '&pass_ticket=' + config.auth.ticket;
	let data = {
		BaseRequest: {
			Uin: config.auth.uin,
			Sid: config.auth.sid,
			Skey: config.auth.SKey
		},
		SyncKey: config.auth.SyncKey,
		rr: tools.getSystemSecond()
	};
	superagent.post(url)
		.set('Cookie', config.auth.cookie || '')
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.send(data)
		.end(function(err, res) {
			let json = null;
			if (err) {
				log.error('获取消息出错: ', err);
			} else if (!res || !res.text) {
				err = new Error('无返回数据');
				log.error('获取消息出错: ', err);
			} else {
				json = JSON.parse(res.text);
			}
			cb(err, json);
		});
};
//检测消息
api.FetchMsg = (cb) => {
	let url = config.SyncCheckUrl.format(config.auth.SKey, tools.getSystemSecond(), config.auth.sid, config.auth.uin, config.auth.deviceId, config.flatSyncKey);
	superagent.get(url)
		.set('Cookie', config.auth.cookie || '')
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.end(function(err, res) {
			let text = null;
			if (err) {
				log.error('检测消息出错: ', err);
			} else if(!res || !res.text) {
				err = new Error('无返回数据');
				log.error('检测消息出错: ', err);
			} else {
				text = res.text;
			}
			cb(err, text);
		});
};
//获取联系人
api.FetchContact = (cb) => {
	let url = config.baseUrl + `/webwxgetcontact?lang=zh_CN&pass_ticket=${config.auth.ticket}&seq=0&skey=${config.auth.SKey}&r=` + tools.getSystemSecond();
	superagent.get(url)
		.set('Cookie', config.auth.cookie || '')
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.end((err, res) => {
			if (err || !res || !res.text) {
				setTimeout(() => api.FetchContact(cb), 1000);
			} else {
				config.contacts = [];
				const memberList = JSON.parse(res.text).MemberList;
				for(let i in memberList) {
					const d = tools.parseUserInfo(memberList[i]);
					config.contacts.push(d);
				}
				cb(err, config.contacts);
			}
		});
};
api.FetchUserInfo = (cb) => {
	let url = config.baseUrl + '/webwxinit?pass_ticket=' + config.auth.ticket + '&r=' + tools.getSystemSecond();
	let data = '{"BaseRequest":{"Uin":"{0}","Sid":"{1}","Skey":"","DeviceID":"{2}"}}'
		.format(config.auth.uin, config.auth.sid, config.auth.deviceId);
	superagent.post(url)
		.set('Cookie', config.auth.cookie || '')
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.send(data)
		.end((err, res) => {
			let json = null;
			if (err) {
				log.error('获取用户信息出错: ', err);
			} else if (!res || !res.text) {
				err = new Error('无返回数据');
				log.error('获取用户信息出错: ', err);
			} else {
				json = JSON.parse(res.text);
			}
			cb(err, json);
		});
};
//获取用户授权
api.FetchUserAuth = (cb) => {
	let urlData = url.parse(config.redirectUrl);
	let options = {
		host: urlData.host,
		port: urlData.port,
		path: urlData.path + '&func=new',
		protocol: urlData.protocol,
		method: 'GET'
	};
	https.request(options, (res) => {
		if(res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
			cb(null, res.headers['set-cookie'].join(';'));
		} else {
			let msg = new Error('获取用户授权失败，状态: ' + res.statusCode);
			log.error(msg);
			cb(msg)
		}
	}).on('error', (err) => {
		log.error('获取用户授权失败: ', err);
		cb(err);
	}).end();
};
//检测微信登录
api.CheckLogin = (cb) => {
	superagent.get(config.CheckScanUrl.format(config.uuid, tools.getSystemSecond()))
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.end((err, res) => {
			let text = null;
			if (err) {
				log.error('微信登录出错: ', err);
			} else if(!res || !res.text) {
				err = new Error('无返回数据');
				log.error('微信登录出错: ', err);
			} else {
				text = res.text;
			}
			cb(err, text);
		});
};
//检测扫描二维码
api.CheckScan = (cb) => {
	superagent.get(config.CheckScanUrl.format(config.uuid, tools.getSystemSecond()))
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.end((err, res) => {
			let text = null;
			if (err) {
				log.error('扫描二维码出错: ', err);
			} else if(!res || !res.text) {
				err = new Error('无返回数据');
				log.error('扫描二维码出错: ', err);
			} else {
				text = res.text;
			}
			cb(err, text);
		});
};
//获取UUID
api.FetchUUID = (cb) => {
	superagent.get(config.FetchUUIDUrl.format(tools.getSystemSecond()))
		.set('Accept-Encoding', 'gzip')
		.set('Content-Type', 'application/json')
		.end((err, res) => {
			let text = null;
			if (err) {
				log.error('获取UUID出错: ', err);
			} else if(!res || !res.text) {
				err = new Error('无返回数据');
				log.error('获取UUID出错: ', err);
			} else {
				text = res.text;
			}
			cb(err, text);
		});
};

module.exports = { beans: [{ id: "WechatApi", func: WechatApi, scope: "singleton" }] };