//微信消息
'use strict';

const hot = require("./HotHelper");
const config = hot.getConfig;
const log = hot.getLog;
const tools = hot.getTools;
const role = hot.getMessageRole;

function WechatMsg() { }
const wxmsg = WechatMsg.prototype;

wxmsg.autoCheckInterval = 1000; //1000*10; //10秒检测
wxmsg.autoReplyInterval = 2; //5*60; //5分钟没有回消息 机器人自动回消息
wxmsg.reloadContactInterval = 1000 * 60 * 5; //5分钟重新加载好友列表

//初始化
wxmsg.init = (bot) => {
	wxmsg.bot = bot;
	setInterval(() => wxmsg.autoCheckMsg(), wxmsg.autoCheckInterval);
	setInterval(() => wxmsg.bot.fetchContact(() => {}), wxmsg.reloadContactInterval)
};
//自动检测消息
wxmsg.autoCheckMsg = () => {
	const now = tools.getSystemSecond();
	for (let from in config.msgs) {
		const msgs = config.msgs[from].splice(0);
		for (let i = 0, len = msgs.length; i < len; i++) {
			const msg = msgs[i];
			if (msg.l + wxmsg.autoReplyInterval > now) wxmsg.autoReplyMsg(from, msg.to, msg.text, msg.fromName, msg.toName);
			else config.msgs[from].push(msg);
		}
	}
};
//自动回复消息
wxmsg.autoReplyMsg = (from, to, content, fromName, toName) => {
	if (!wxmsg.bot) wxmsg.bot = hot.getWechatBot;
	for (let i = 0, len = role.all.length; i < len; i++) {
		let text = role.all[i](content.toLowerCase()), list = [];
		if (text) {
			if (tools.isString(text)) list.push(text);
			if (tools.isArray(text)) list = text;
			for (let j = 0, len2 = list.length; j < len2; j++) {
				text = list[j];
				wxmsg.bot.sendTextMsg(from, text, (err) => {
					if (err) log.error(fromName, '->', toName, '失败：', content, text);
					else log.info(fromName, '->', toName, '成功：', content, text);
				});
			}
			return true;
		}
	}
	return false;
};
//如果手动回复了，就不自动回复
wxmsg.clearAutoReplyMsg = (from, to, msg) => {
	if (config.msgs[to.userName]) delete config.msgs[to.userName];
	if (msg.Content == '[系统自动回复]') {
		if (!wxmsg.bot) wxmsg.bot = hot.getWechatBot;
		wxmsg.bot.sendTextMsg(to.userName, role.welcomeMsg, (err) => { if (err) log.error('发送失败！', err); });
	}
};
//解消息
wxmsg.putMsg = (sender, msg) => {
	if (msg.FromUserName.startsWith("@@")) return; //过滤群消息；
	let to = tools.getUserByUserName(msg.ToUserName);
	switch (msg.MsgType) {
		case 1: wxmsg.putTextMsg(sender, to, msg); break; //文本消息
		case 3: wxmsg.putImageMsg(sender, to, msg); break; //图片消息
		case 34: wxmsg.putVoiceMsg(sender, to, msg); break; //语音消息
		case 10002: break; //撤回了一条消息
		default: wxmsg.putOtherMsg(sender, to, msg); break;
	}
};
//解文本消息
wxmsg.putTextMsg = (from, to, msg) => {
	if (!from || !to) return log.error('from & to error!', from, to, msg);
	log.info(`${from.nickName} -> ${to.nickName}: ${msg.Content}`);
	if (from.userName == config.user.userName) return wxmsg.clearAutoReplyMsg(from, to, msg);
	if (!config.msgs[from.userName]) config.msgs[from.userName] = [];
	const text = msg.Content.replace(/\<br\/\>/g, '\n').trim();
	config.msgs[from.userName].push({ to: to.userName, text: text, toName: to.nickName, fromName: from.nickName, l: tools.getSystemSecond() });
};
//解图片消息
wxmsg.putImageMsg = (from, to, msg) => {
	//console.log(from, to, msg);
};
//解语音消息
wxmsg.putVoiceMsg = (from, to, msg) => {
	//console.log(from, to, msg);
};
//解其它消息
wxmsg.putOtherMsg = (from, to, msg) => {
	//console.log(from, to, msg);
};

module.exports = { beans: [{ id: "WechatMsg", func: WechatMsg, scope: "singleton" }] };