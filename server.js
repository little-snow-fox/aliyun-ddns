const express = require('express');
const app = express();

// 这个服务端是部署在服务器的，目的是为了让客户端可以通过这个服务器获取IP而使用的。
// 为什么不使用第三方服务器？你20S请求人家一次，人家不封你IP？
app.get('/', function (req, res) {
  const strList = req.connection.remoteAddress.split(':');
  res.send({
    ip: strList[strList.length - 1],
    time: new Date()
  });
});

const server = app.listen(3002, function () {
  const host = server.address().address;
  const port = server.address().port;

  console.log('get ip app listening at http://%s:%s', host, port);
});
