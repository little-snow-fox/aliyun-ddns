const fs = require('fs');
const fetch = require('node-fetch');
const AliCloudClient = require('aliyun-apisign/aliCloudClient');
const Log = require('log');
let logDate = new Date();
let log = new Log('main', fs.createWriteStream(`log/${logDate.getFullYear()}_${logDate.getMonth() + 1}_${logDate.getDate()}.log`, { flags: 'a' }));

// 这是获取本机外网最新IP的服务器地址，建议你使用server.js进行自建服务器，而不是使用我的服务器
const getMyIpServerPath = 'http://ip.ails.cc:3002';

// 这段配置需要修改为自己的阿里云相关信息
const domainName = 'home.ails.cc'; // 你的子域名
const ttl = 600; // 你的ttl时间
let aliClient = new AliCloudClient({
  AccessKeyId: 'LTAIw44pera2Tohy', // 这个就不废话了。样例ID，假的，别想多了
  AccessKeySecret: '437KFbukL4HPMetB8dPdvEZqtTCHic', // 这个也不废话了。样例秘钥，假的，别想多了
  serverUrl: 'http://alidns.aliyuncs.com' // 这个不用动写死就好
});

// 更新日志文件的写入对象
setInterval(() => {
  const date = new Date();
  if (logDate.getDate() !== date.getDate()) {
    logDate = new Date();
    log = new Log('main', fs.createWriteStream(`log/${logDate.getFullYear()}_${logDate.getMonth() + 1}_${logDate.getDate()}.log`, { flags: 'a' }));
  }
}, 10000);

// 启动主功能
main().then().catch((e) => {
  log.error(e);
});

async function main() {
  let currentIp;
  const getDomainNameListData = await aliClient.get('/', {
    Action: 'DescribeSubDomainRecords',
    SubDomain: domainName,
    Type: 'A'
  }).catch((error) => {
    log.error(error);
    return null;
  });
  if (!getDomainNameListData) {
    return;
  }
  // 获取domainName在阿里云中的数据对象
  const domainNameList = getDomainNameListData.body.DomainRecords.Record;
  let domainNameInfo;
  if (domainNameList.length > 0) {
    domainNameInfo = domainNameList[0];
  }
  if (!domainNameInfo) {
    log.info(`从阿里云中找不到${rr}的A解析记录，稍后会自动创建`);
  } else {
    currentIp = domainNameInfo.Value;
    log.info('当前解析记录:', domainNameInfo);
  }

  // 执行一次IP检测
  checkMyIp();
  // 执行IP检测定时器
  setInterval(() => {
    try {
      checkMyIp();
    } catch (error) {
      log.error(error);
    }
  }, 20 * 1000);

  // 检查本机外网IP是否变更，是则更新
  async function checkMyIp() {
    const newIp = await fetch(getMyIpServerPath, { timeout: 15 * 1000 })
      .then(res => res.json())
      .catch((error) => {
        log.error(error);
        return null;
      });
    if (newIp && newIp.ip !== currentIp) {
      log.info('开始更新IP');
      const newDomainNameInfo = await aliClient.get('/', {
        Action: 'UpdateDomainRecord',
        RecordId: domainNameInfo.RecordId,
        RR: domainNameInfo.RR,
        Type: domainNameInfo.Type,
        Value: newIp.ip,
      }).catch((error) => {
        log.error(error);
        return null;
      });
      log.info(newDomainNameInfo);
    }
  }
}
