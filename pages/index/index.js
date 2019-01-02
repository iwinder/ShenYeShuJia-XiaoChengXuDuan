// var Session = require("../../lib/session")
var Login = require("../../lib/login") 
var wcloud = require("../../lib/index") 
var config = require("../../config")
//index.js
//获取应用实例
const app = getApp()
var sliderWidth = 96; // 需要设置slider的宽度，用于计算中间位置
Page({
  data: {
    tabs: ["在读", "未读", "已读", "所有"],
    activeIndex: 0,
    sliderOffset: 0,
    sliderOffsetUnit:0,
    sliderLeft: 0,
    readType:"在读",
    readNum:0,
    grids: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    imgMode: 'aspectFit',
    imgWith:300,
    imgHeigh:400,
    imgSrc:'../../image/test_book.jpg',
    scrollTop: 0,
    scrollHeight:0,

    sessionStr:null,
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),

    showModalStatus: false,
    showNavStatus:false,
    readStatuss: ["在读", "未读", "已读"],
    readStatusIndex: 0,
    nowBookIbj:{

    },
    addBookObj:{
      info:null,
      oldReadStatus:1,
      newReadStatus:1,
      addType:1,//2 之前已存在 1新添加
    },
    readObjs:{
      pageSize:10
    },
    readNowObj:{
      pageInfo:{
        pageSize:0,
        currentPage:1,
        totalResultSize:0
      },
      bottomType: false,
      isAlllond: false,
      readObjs:[],
    },
    readNoObj:{
      pageInfo: {
        pageSize: 0,
        currentPage: 1,
        totalResultSize: 0
      },
      bottomType:false,
      isAlllond: false,
      readObjs: [],
    },
    readFinishObj:{
      pageInfo: {
        pageSize: 0,
        currentPage: 1,
        totalResultSize: 0
      },
      bottomType: false,
      isAlllond:false,
      readObjs: [],
    },
    readAllObj:{
      pageInfo: {
        pageSize: 0,
        currentPage: 1,
        totalResultSize: 0
      },
      bottomType: false,
      isAlllond: false,
      readObjs: [],
    }
  },
  onLoad:function(){
    var that = this;
    wx.getSystemInfo({
      success: function (res) {   
        that.setData({
          scrollHeight: 100,
          sliderLeft: (res.windowWidth / that.data.tabs.length - sliderWidth) / 2,
          sliderOffset: res.windowWidth / that.data.tabs.length * that.data.activeIndex,
          sliderOffsetUnit: res.windowWidth / that.data.tabs.length,
        });
      }
    });

    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
          var readStatus = that.data.activeIndex + 1;
          if (readStatus == 4) {
            readStatus = -1;
          }
         
          this.getReadObjInfos(that,readStatus);
        // }

    //   }
    // });
   

    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse) {
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
  },
  bindDownLoadOne:function(){
   var that = this;
  //  this.getReadObjInfos(that, 1);
   this.downLoadAddDataFunc(this, "readNowObj", 1);
  },
  bindDownLoadTwo: function () {
    var that = this;
    // this.getReadObjInfos(that, 2);
    this.downLoadAddDataFunc(this, "readNoObj", 2);
  },
  bindDownLoadThree: function () {
    var that = this;
    this.downLoadAddDataFunc(this, "readFinishObj", 3);
  },
  bindDownLoadFour: function () {
    var that = this;
  
    this.downLoadAddDataFunc(this,"readAllObj",-1);
  },
  downLoadAddDataFunc:function(that,obj,num){
    var pageInfo = that.data[obj].pageInfo;
    var currentPage = pageInfo.currentPage + 1;
    if (currentPage <= pageInfo.totalPageSize) {
      that.data[obj].pageInfo.currentPage = currentPage;
      that.getReadObjInfos(that, num);
    } else {
      if (!that.data[obj].bottomType){
        that.data[obj].bottomType = true;
        wx.showToast({
          title: '没有更多内容了',
          icon: 'success',
          duration: 2000
        })
      }
      
      
    }
  },
  tabClick: function (e) {
   var that = this;

    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.dataset.id,
      readType: this.data.tabs[e.currentTarget.dataset.id]
    });
    var readStatus = e.currentTarget.dataset.id+1;
    if (readStatus==4){
      readStatus = -1;
    }
    this.getReadNumOfStatus(readStatus);
    this.getReadObjInfos(that, readStatus);
  },
  tabClickByJS:function(obj,that){
    that.setData({
      sliderOffset: obj.offsetLeft,
      activeIndex: obj.datasetId,
      readType: that.data.tabs[obj.datasetId]
    });
    this.getReadNumOfStatus(obj.datasetId);
  },
  open: function () {
    //是否已授权登录，
    if (app.globalData.userInfo){
      //是--获取用户信息，调用toshowActionSheet
      this.toshowActionSheet(app.globalData.userInfo);
    }else{
      //否，调用login
      wcloud.login({ success: this.toshowActionSheet, fail: this.doLoginFail });
    }

    //
  },
  toshowActionSheet:function(userInfo){
    app.globalData.userInfo = userInfo;
    var that = this;
    wx.showActionSheet({
      itemList: ['扫码加书', '搜索加书'],
      success: function (res) {
        if (!res.cancel) {
          //0扫码
          if (res.tapIndex==0){
            that.toScanCode();
          }else{
            wx.navigateTo({
              url: '../search/search'
            });
            that.reSetAllisAlllondStatus();
          }
          //1搜索
        }
      }
    });
  },
  toScanCode:function(){
    var that = this;
    this.setData({
      readStatusIndex:0,
      "addBookObj.newReadStatus":1,
    })
    wx.scanCode({
      success: (res) => {
        wx.showLoading({
          title: '加载中',
        })
        wcloud.request({
          login: true,
          url: config.service.apiUrlhead+"getBookByISBN",
          data:{
            isbn:res.result
          },
          success: function (response) {
            wx.hideLoading();

            if(response.data.code>0){
              that.setData({
                "addBookObj.info": response.data.result,
                "addBookObj.oldReadStatus": response.data.result.readStatus,
                "addBookObj.addType": response.data.code,
                "readStatusIndex": response.data.result.readStatus - 1,
              });
              that.powerDrawer("open");
            }else {

            }



          },
          fail: function (err) {
            wx.hideLoading()
            wx.showToast({
              title: err.errMsg,
            })
          }
        })
      }
    })
  },
  getUserInfoS:function(e){
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
   
  },//getUserInfoS end
  doLoginSuccess: function (obj) {
    app.globalData.userInfo = obj;
    this.setData({
      userInfo: obj,
            // sessionStr: Session.get().id,
            hasUserInfo: true
          })

  },
  doLoginFail: function (obj) {
   wx.showToast({
     title: obj.errMsg,
   })
  },
  navDiyUtil: function (currentStatu) {
    /* 动画部分 */
    // 第1步：创建动画实例   
    var animation = wx.createAnimation({
      duration: 200,  //动画时长  
      timingFunction: "linear", //线性  
      delay: 0  //0则不延迟  
    });
    // 第2步：这个动画实例赋给当前的动画实例  
    this.animation = animation;
    // 第3步：执行第一组动画  
    animation.opacity(0).rotateX(-100).step();
    // 第4步：导出动画对象赋给数据对象储存  
    this.setData({
      animationData: animation.export()
    })
    // 第5步：设置定时器到指定时候后，执行第二组动画  
    setTimeout(function () {
      // 执行第二组动画  
      animation.opacity(1).rotateX(0).step();
      // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象  
      this.setData({
        animationData: animation
      })
      //关闭  
      if (currentStatu == "close") {
        this.setData(
          {
            showNavStatus: false
          }
        );
      }
    }.bind(this), 200)
    // 显示  
    if (currentStatu == "open") {
      this.setData(
        {
          showNavStatus: true
        }
      );
    }

   
  },//util,
  powerNavDrawer: function (e) {
    var currentStatu = e.currentTarget.dataset.statu;
    if (currentStatu !="close"){
      this.data.nowBookIbj.info = e.currentTarget.dataset.info;
      this.data.nowBookIbj.oldReadStatus = e.currentTarget.dataset.info.readStatus;
      this.data.nowBookIbj.newReadStatus = e.currentTarget.dataset.info.readStatus;
      this.data.addType = 2;
    }
    this.navDiyUtil(currentStatu)
  
   
  }, 
  lookInfo:function(e){
    var bid = this.data.nowBookIbj.info.bid;
   
    wx.navigateTo({
      url: '../bookInfo/bookInfo?bid='+bid
    });
    this.setData({
      showNavStatus: false
    })
  },

  modalDiyUtil: function (currentStatu) {
    /* 动画部分 */
    // 第1步：创建动画实例   
    var animation = wx.createAnimation({
      duration: 200,  //动画时长  
      timingFunction: "linear", //线性  
      delay: 0  //0则不延迟  
    });
    // 第2步：这个动画实例赋给当前的动画实例  
    this.animation = animation;
    // 第3步：执行第一组动画  
    animation.opacity(0).rotateX(-100).step();
    // 第4步：导出动画对象赋给数据对象储存  
    this.setData({
      animationData: animation.export()
    })
    // 第5步：设置定时器到指定时候后，执行第二组动画  
    setTimeout(function () {
      // 执行第二组动画  
      animation.opacity(1).rotateX(0).step();
      // 给数据对象储存的第一组动画，更替为执行完第二组动画的动画对象  
      this.setData({
        animationData: animation
      })
      //关闭  
      if (currentStatu == "close") {
        this.setData(
          {
            showModalStatus: false
          }
        );
      }
      //
      if (currentStatu == "confirm") {
        var newReadStatus = this.data.addBookObj.newReadStatus;
        var oldReadStatus = this.data.addBookObj.oldReadStatus;
        var that = this;
        if (newReadStatus != oldReadStatus) {
          //不同，更新
          wx.showLoading({
            title: '修改中',
          })
          wcloud.request({
            login: true,
            url: config.service.apiUrlhead+"updateReadStatus",
            data: {
              id: that.data.addBookObj.info.id,
              readStatus: newReadStatus
            },
            success: function (response) {
              wx.hideLoading();
              //修改成功
              //重新加载,对应newReadStatus的列表
              that.reSetisAlllondStatus(newReadStatus);
              that.getReadObjInfos(that, newReadStatus, 1);
            },
            fail: function (err) {
              wx.hideLoading();
              wx.showToast({
                title: err.Msg,

              })
            }
          });//wcloud.request end
        } else {
          //不需要更新阅读状态
          //若本身为新添加，重新获取对应的列表，反之不更改          
          var addType = that.data.addBookObj.addType;
          if (addType == 1) {
            //新添加，重新获取对应列表
            that.reSetisAlllondStatus(newReadStatus);
            that.getReadObjInfos(that, newReadStatus, 1);
          }
        }
        this.setData(
          {
            showModalStatus: false
          }
        );
      }//confirm
    }.bind(this), 200)
    // 显示  
    if (currentStatu == "open") {
      this.setData(
        {
          showModalStatus: true
        }
      );
    }


  },//util,
  powerDrawer: function (e) {

    if (e != null && e == "open") {
      this.modalDiyUtil(e);
    } else {
      var currentStatu = e.currentTarget.dataset.statu;
      if (currentStatu == "openByNav"){
        this.setData({
          showNavStatus : false,
          addBookObj: this.data.nowBookIbj
        })
        currentStatu = "open"
     
      }
      this.modalDiyUtil(currentStatu);
      
      
    }

  },
  
  bindReadStatusChange: function (e) {
    this.setData({
      readStatusIndex: e.detail.value,
      "addBookObj.newReadStatus":  parseInt(e.detail.value)+1,
    })
  },

  reSetAllisAlllondStatus:function(){
   
    this.data[this.getReadStatusOfText(1)].isAlllond = false;
    this.data[this.getReadStatusOfText(2)].isAlllond = false;
    this.data[this.getReadStatusOfText(3)].isAlllond = false;
    this.data[this.getReadStatusOfText(4)].isAlllond = false;
  },
  reSetisAlllondStatus: function (readStatus){
    var flg = this.getReadStatusOfText(readStatus);
    this.data[flg].isAlllond = false;
  },
  getIsAlllondStatus: function (readStatus){
    var flg = this.getReadStatusOfText(readStatus);
    return this.data[flg].isAlllond;
  },
  getReadStatusOfText: function (readStatus){
    var flg = "";
    if (readStatus == 1) {
      //在读
      flg = "readNowObj";
    } else if (readStatus == 2) {
        //未读
      flg = "readNoObj";
    } else if (readStatus == 3) {
       //已读
      flg = "readFinishObj";
    } else {
      //所有
      flg = "readAllObj";
    }
    return flg;
  },
  getReadNumOfStatus: function (readStatus){
    var flg = this.getReadStatusOfText(readStatus);
    var readNum = this.data[flg].pageInfo.totalResultSize ? this.data[flg].pageInfo.totalResultSize :0;
    this.setData({
      readNum: readNum
    })

  },
  getReadObjInfos: function (that,readStatus, currentPage){
   
    // var currentPage = 0;
    var data = {};
    data.readStatus = readStatus;
    if (this.getIsAlllondStatus(readStatus)){
      return false;
    }
    wx.showLoading({
      title: '加载中',
    })
    var flg = this.getReadStatusOfText(readStatus);
 
    data.pageSize = this.data.readObjs.pageSize;
    data.currentPage = currentPage ? currentPage : this.data[flg].pageInfo.currentPage;
   
    wcloud.request({
      login: true,
      url: config.service.apiUrlhead+"findUserBook",
      data: data,
      success: function (response) {
        wx.hideLoading();
        //修改成功
        
        //判断是否需要切换table
        var activeIndexTmp = that.data.activeIndex+1;
        var readStatusTmp = readStatus;
        if (readStatusTmp<0){
          readStatusTmp = 4;
        }

        var readStatusTmpt = readStatusTmp -1;
        var newOffSetLeft = that.data.sliderOffsetUnit * readStatusTmpt;
        var oldOffSetLeft = that.data.sliderOffset;
        if ((activeIndexTmp != readStatusTmp) || ((activeIndexTmp == readStatusTmp)&&(newOffSetLeft != oldOffSetLeft))){
          //当前展示与所需不同时，需要切换
          that.tabClickByJS({
            "offsetLeft": newOffSetLeft,
            "datasetId": readStatusTmpt,
          },that);
        }

        var newarray = response.data.result.rows;
        var pageInfo = response.data.result.pageInfo;
        var newarrays = response.data.result.rows;
        //重新加载,对应newReadStatus的列表
        var newFlg = that.getReadStatusOfText(readStatus);

        if (pageInfo.currentPage == 1){
          that.setData({
            "readNum": pageInfo.totalResultSize,
          })
        }
        if (pageInfo.currentPage > 1) {
          newarrays = that.data[newFlg].readObjs.length > 0 ? that.data[newFlg].readObjs.concat(newarray) : newarray;
        }
        if (pageInfo.currentPage == pageInfo.totalPageSize) {
          that.data[newFlg].isAlllond = true;
        }
        var pageParm = newFlg + ".pageInfo";
        var readObjsParm = newFlg + ".readObjs";
        that.setData({
          [pageParm]: pageInfo,
          [readObjsParm]: newarrays,
       
        })

      },
      fail: function (err) {
        wx.hideLoading();
        wx.showToast({
          title: err.message,
        })
      }
    });
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: "我的书架",
      path: "/pages/index/index",
      success: function (res) {
        // 转发成功
        wx.reportAnalytics('share', {
          page: "index",
          flag: "success"
        })
      },
      fail: function (res) {
        // 转发失败
        wx.reportAnalytics('share', {
          page: "userInfo",
          flag: "fail"

        })
      }
    }
  },
  getUserInfo: function (e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  }
});