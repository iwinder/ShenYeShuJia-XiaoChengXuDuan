var config = require("../config");
var utils = require('./utils');
var constants = require('./constants');
var Session = require('./session');


var loginAuthFlag = true;

/***
 * @class
 * 表示登录过程中发生的异常
 */
var LoginError = (function () {
  function LoginError(type, message) {
    Error.call(this, message);
    this.type = type;
    this.message = message;
  }

  LoginError.prototype = new Error();
  LoginError.prototype.constructor = LoginError;

  return LoginError;
})();

/**
 * 微信登陆，获取code和encryptData
 * callback 结果回调方法，用于后续执行。
 */
var getWxLoginResult = function (callback){

  wx.login({
    success: loginResult => {
      // 发送 res.code 到后台换取 openId, sessionKey, unionId
      if (loginResult.code) {
        wx.getUserInfo({
          success: userResult => {
            callback(null,{
              pid: config.pid,
              code: loginResult.code,
              encryptedData: userResult.encryptedData,
              iv: userResult.iv,
              userInfo: userResult.userInfo,
            });
          },
          fail: userError => {
            wx.showModal({
               title: "无法完成授权", 
               content: "需要授权才可进行,如想继续使用，请点击确定并在后续步骤中允许获取用户信息", 
               success: function(res) {
                //  if (res.confirm) {
                //    console.log('用户点击确定');
                //    wx.openSetting({
                //      success: function (data) {
                //        console.log(" open data");
                //      },
                //      fail: function (error) {
                //        console.log(error);
                //      }
                //    })
                //  } else if (res.cancel) {
                //    console.log('用户点击取消')
                //  }
               }
             }) 
            
            // 当拒绝授权的时候，提示用户需要开启权限，确认时调用微信的权限管理界面
            // callback('fail to modify scope', null)

            var error = new LoginError(constants.ERR_WX_GET_USER_INFO, '获取微信用户信息失败，请检查网络状态');
            error.detail = userError;
            callback(error, null);
          }
        })
      } else {
        var error = new LoginError(constants.ERR_WX_LOGIN_FAILED, '微信登录失败，请检查网络状态');
        error.detail = loginError;
        callback(error, null);
      }
    }
  })//wx.login end
}//getWxLoginResult() end

var noop = function noop() { };
var defaultOptions = {
  method: 'GET',
  success: noop,
  fail: noop,
  loginUrl: null,
};

var login = function login(options) {
  options = utils.extend({}, defaultOptions, options);

  if (!defaultOptions.loginUrl) {
    options.fail(new LoginError(constants.ERR_INVALID_PARAMS, '登录错误：缺少登录地址，请通过 setLoginUrl() 方法设置登录地址'));
    return;
  }
  var doLogin = () => getWxLoginResult(function (wxLoginError, wxLoginResult) {
    if (wxLoginError) {
      options.fail(wxLoginError);
      return;
    }

    var userInfo = wxLoginResult.userInfo;

    // 构造请求头，包含 code、encryptedData 和 iv
    var code = wxLoginResult.code;
    var encryptedData = wxLoginResult.encryptedData;
    var iv = wxLoginResult.iv;
    var pid = wxLoginResult.pid;
    var header = {};

    header[constants.WX_HEADER_CODE] = code;
    header[constants.WX_HEADER_PID] = pid;
    header[constants.WX_HEADER_ENCRYPTED_DATA] = encryptedData;
    header[constants.WX_HEADER_IV] = iv;

    // 请求服务器登录地址，获得会话信息
    wx.request({
      url: options.loginUrl,
      header: header,
      method: options.method,
      data: options.data,

      success: function (result) {
        var data = result.data;
  
        // 成功地响应会话信息
        if (data && data[constants.WX_SESSION_MAGIC_ID]) {
         
          if (data.session) {
            data.session.userInfo = userInfo;
            Session.set(data.session);
            options.success(userInfo);
          } else {
            var errorMessage = '登录失败(' + data.error + ')：' + (data.message || '未知错误');
            var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
            options.fail(noSessionError);
          }

          // 没有正确响应会话信息
        } else {
          var errorMessage = '登录请求没有包含会话响应，请确保服务器处理 `' + options.loginUrl + '` 的时候正确使用了 SDK 输出登录结果';
          var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
          options.fail(noSessionError);
        }
      },

      // 响应错误
      fail: function (loginResponseError) {
        var error = new LoginError(constants.ERR_LOGIN_FAILED, '登录失败，可能是网络错误或者服务器发生异常');
        options.fail(error);
      },
    });

  });//doLogin() end

  var session = Session.get();
  if (session) {
    wx.checkSession({
      success: function () {
        options.success(session.userInfo);
      },

      fail: function () {
        Session.clear();
        doLogin();
      },
    });
  } else {
    doLogin();
  }

}//login()end

var setLoginUrl = function (loginUrl) {
  defaultOptions.loginUrl = loginUrl;
};

module.exports = {

  LoginError: LoginError,
  login: login,
  setLoginUrl: setLoginUrl,
  
};