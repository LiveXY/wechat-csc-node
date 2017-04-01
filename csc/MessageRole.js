//消息规则
'use strict';

const hot = require('./HotHelper');
const tools = hot.getTools;

function MessageRole() { }
const role = MessageRole.prototype;

role.welcomeMsg = '你好，R2为你服务：\n注册会员(请回复zchy)\n了解公司产品(请回复ljcp)\n我的购物车(请回复gwc)';

role.all = [
	t => { if (/^(zchy)$/i.test(t)) return '欢迎你注册会员！'; },
	t => { if (/^(ljcp)$/i.test(t)) return '欢迎你了解公司产品！'; },
	t => { if (/^(gwc)$/i.test(t)) return '打开我的购物车！'; },

	t => { if (/^[a-zA-Z0-9]+$/i.test(t)) return '输入错误！'; },
	t => { if (/^(你好|在吗|在)$/i.test(t)) return role.welcomeMsg; }
];

module.exports = { beans: [{ id: 'MessageRole', func: MessageRole, scope: 'singleton' }] };