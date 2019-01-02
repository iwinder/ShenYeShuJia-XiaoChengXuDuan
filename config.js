// var host = 'https://book.windcoder.com/nightbook';
// var host = 'http://localhost:8080';
var host = 'http://localhost:8000';
var config = {
  pid:1,
  // 下面的地址配合云端 Demo 工作
  service: {
    host,

    // 登录地址，用于建立会话
    // loginUrl: `https://${host}/login`,
    loginUrl: `${host}/auth/home`,
    apiUrlhead: `${host}/jsapi/mina/`,
    // 测试的请求地址，用于测试会话
    requestUrl: `https://${host}/user`,

    // 测试的信道服务地址
    tunnelUrl: `https://${host}/tunnel`,
  }
};
module.exports = config;