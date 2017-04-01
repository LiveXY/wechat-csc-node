//配置
'use strict';

function Config() {}
const c = Config.prototype;

c.FetchUUIDUrl = 'https://login.wx.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_={0}';
c.QRCodeUrl = 'https://login.weixin.qq.com/qrcode/{0}';
c.CheckScanUrl = 'https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login?loginicon=false&uuid={0}&tip=0&_={1}';
c.CheckLoginUrl = 'https://login.wx.qq.com/cgi-bin/mmwebwx-bin/login?uuid={0}&tip=1&_={1}';
c.SyncCheckUrl = 'https://webpush.weixin.qq.com/cgi-bin/mmwebwx-bin/synccheck?skey={0}&callback=jQuery183084135492448695_1420782130686&r={1}&sid={2}&uin={3}&deviceid={4}&synckey={5}';

c.msgs = {};

module.exports = { beans: [{ id: 'Config', func: Config, scope: 'singleton' }] };