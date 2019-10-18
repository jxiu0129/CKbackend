const rp = require('request-promise');
const request = require('request');
const Attendance = require("../models/attendance");
const Event = require("../models/event");
const User = require("../models/user");
const moment = require('moment');

let API_LoginCode;
let API_Access;
let API_RefreshClock;
let API_User;
// 2.克制化時間格式 (年 月 日 上/下午 )

moment.locale('zh-tw', {
    months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split('_'),
    monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split('_'),
    weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
    weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
    weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
    longDateFormat: {
      LT: 'Ah點mm分',
      LTS: 'Ah點m分s秒',
      L: 'YYYY-MM-DD',
      LL: 'YYYY年MMMD日',
      LLL: 'YYYY年MMMD日Ah點mm分',
      LLLL: 'YYYY年MMMD日ddddAh點mm分',
      l: 'YYYY-MM-DD',
      ll: 'YYYY年MMMD日',
      lll: 'YYYY年MMMD日Ah點mm分',
      llll: 'YYYY年MMMD日ddddAh點mm分'
    },
    meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
    meridiemHour: function (h, meridiem) {
      let hour = h;
      if (hour === 12) {
        hour = 0;
      }
      if (meridiem === '凌晨' || meridiem === '早上' ||
        meridiem === '上午') {
        return hour;
      } else if (meridiem === '下午' || meridiem === '晚上') {
        return hour + 12;
      } else {
        // '中午'
        return hour >= 11 ? hour : hour + 12;
      }
    },
    meridiem: function (hour, minute, isLower) {
      const hm = hour * 100 + minute;
      if (hm < 1200) {
        return '上午';
      } else {
        return '下午';
      }
    },
    calendar: {
      sameDay: function () {
        return this.minutes() === 0 ? '[今天]Ah[點整]' : '[今天]LT';
      },
      nextDay: function () {
        return this.minutes() === 0 ? '[明天]Ah[點整]' : '[明天]LT';
      },
      lastDay: function () {
        return this.minutes() === 0 ? '[昨天]Ah[點整]' : '[昨天]LT';
      },
      nextWeek: function () {
        let startOfWeek, prefix;
        startOfWeek = moment().startOf('week');
        prefix = this.diff(startOfWeek, 'days') >= 7 ? '[下]' : '[本]';
        return this.minutes() === 0 ? prefix + 'dddA點整' : prefix + 'dddAh點mm';
      },
      lastWeek: function () {
        let startOfWeek, prefix;
        startOfWeek = moment().startOf('week');
        prefix = this.unix() < startOfWeek.unix() ? '[上]' : '[本]';
        return this.minutes() === 0 ? prefix + 'dddAh點整' : prefix + 'dddAh點mm';
      },
      sameElse: 'LL'
    },
    ordinalParse: /\d{1,2}(日|月|周)/,
    ordinal: function (number, period) {
      switch (period) {
        case 'd':
        case 'D':
        case 'DDD':
          return number + '日';
        case 'M':
          return number + '月';
        case 'w':
        case 'W':
          return number + '周';
        default:
          return number;
      }
    },
    relativeTime: {
      future: '%s内',
      past: '%s前',
      s: '幾秒',
      m: '1 分鐘',
      mm: '%d 分鐘',
      h: '1 小時',
      hh: '%d 小時',
      d: '1 天',
      dd: '%d 天',
      M: '1 個月',
      MM: '%d 个月',
      y: '1 年',
      yy: '%d 年'
    },
    week: {
      // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
      dow: 1, // Monday is the first day of the week.
      doy: 4  // The week that contains Jan 4th is the first week of the year.
    }
  });


exports.index = function(req,res){
    // if(!req.session.code){
    //     res.render('index');
    // }
    // else{
    //     res.render('login_index');
    // }
    res.render('root/index');
};

exports.logout_but = (req, res) => {
    console.log('log out!');
    req.session.destroy();
}

let getUserInfo = (req, access_token_input) => {
    rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
        'auth': {
            'bearer': access_token_input
        }
    }).then((msg) => {
        console.log(msg);
        API_User = msg;
        req.session.user_info = API_User;
        req.session.API_Access = API_Access;
        req.session.API_RefreshClock = Date.now();
        req.session.save();
    }).catch((err) => {
        console.log('Fail to get userinfo because of :');
        console.log(err);
    });
};

exports.getUserInfoOutSide = (req, access_token_input) => {
    rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
        'auth': {
            'bearer': access_token_input
        }
    }).then((msg) => {
        console.log(msg);
        API_User = msg;
        req.session.user_info = API_User;
        req.session.API_Access = API_Access;
        req.session.API_RefreshClock = Date.now();
        req.session.save();
    }).catch((err) => {
        console.log('Fail to get userinfo because of :');
        console.log(err);
    });
};
// module.exports =  getUserInfo();

exports.login_index = function(req, res){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.redirect("http://attend.nccu.edu.tw/");
    }else{
        rp.get('http://wm.nccu.edu.tw:3001/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://attend.nccu.edu.tw/login_index&code=' + API_LoginCode, function(req,res, body){
            API_Access = JSON.parse(body);
        })
        .catch(() => {
            console.log('wrong');
            console.log(API_Access);
            rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
                'auth': {
                    'bearer': API_Access.access_token
                }
            })
            .then((message) => {
                API_User = JSON.parse(message);
                console.log(API_User.user_info.sponsor_point);
                req.session.user_info = API_User;
                req.session.API_Access = API_Access;
                req.session.API_RefreshClock = Date.now();
                req.session.save();
    
                console.log(req.session.user_info);
            })
            .catch(() =>{
                console.log('fail');
            });
        });
        res.render('root/login_index', {username: req.session.user_info.user_info.name});
    }
};

exports.login_index_new = function(req, res){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.redirect("http://attend.nccu.edu.tw/");
    }else{
        rp.get('http://wm.nccu.edu.tw:3001/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://attend.nccu.edu.tw/login_index&code=' + API_LoginCode, function(req,res, body){
            API_Access = JSON.parse(body);
        })
        .catch(async () => {
            req.session.reload();
            console.log('wrong');
            console.log(API_Access);
            await getUserInfo(req ,API_Access.access_token);
            res.render('root/login_index',{username :req.session.user_info.user_info.username});
            // rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
            //     'auth': {
            //         'bearer': API_Access.access_token
            //     }
            // })
            // .then((message) => {
            //     API_User = JSON.parse(message);
            //     console.log(API_User.user_info.sponsor_point);
            //     req.session.user_info = API_User;
            //     req.session.API_Access = API_Access;
            //     req.session.API_RefreshClock = Date.now();
            //     req.session.save();
    
            //     console.log(req.session.user_info);
            // })
            // .catch(() =>{
            //     console.log('fail');
            // });
        });
    }
};

exports.profile_user = async function(req, res){
    req.session.reload();
    User.findOne({email:req.session.user_info.user_info.email})
    .exec((err,theuser)=>{
        res.render('root/profile',{username : theuser.name ,nPoint:req.session.user_info.user_info.sponsor_point ,user : theuser});
    });
};

let multipoint = {
    method: 'POST',
    uri: 'http://wm.nccu.edu.tw:3001/openapi/send_point',
    auth: {
        'bearer' : ''
    },
    body: {
        email: "",
	    to_accounts : [],
	    point : 0,
	    description : ''
    },
    json: true // Automatically stringifies the body to JSON
};

exports.Send_Multi_Point = async function(req, res){    
    let attndid;
    let list = [];
    let event_name;
    let point;
    let remainder;
    let count=0;
    await Event.findById(req.params.eventid)
    .exec((err, data) => {
        if (err) { 
            console.log(err);
        }else{
            console.log(data.AttendanceList[0]);
            attndid = data.AttendanceList[0];
            event_name = data.name;
            point = data.expense;
            Attendance.findById(attndid)
            .exec((err, data) => {
                if (err){
                    console.log(err);
                }else{
                    for(let i = 0; i < data.list.length;i++)
                    {
                        if(data.list[i].reward == true){
                            list.push(data.list[i].email);
                            count++;
                        }
                    }
                }
                console.log(list);
                remainder = point % count;
                point = (point - remainder) / count;
                let sendpoint = multipoint;
                sendpoint.body.email = req.session.user_info.user_info.email;
                sendpoint.auth.bearer = req.session.API_Access.access_token;
                sendpoint.body.to_accounts = list;
                sendpoint.body.point = point;
                sendpoint.body.description = event_name;
                console.log(sendpoint);
                rp(sendpoint)
                .then((message) =>{
                    console.log(message);
                })
                .catch((err) =>{
                    console.log(err);
                });
                                
                // 按下活動結束後會更改活動的status為finsih
                Event.findByIdAndUpdate(req.params.eventid , {status : 'finish',SendPoint : point})
                .exec(console.log("Successfully change status to finished"));

                // 活動結束後將spendedAmount扣回
                // Event.findById
                
            });
            User.findOne({email:req.session.user_info.user_info.email})
            .exec((err,user)=>{
                User.findByIdAndUpdate(user._id,{spendedAmount : user.spendedAmount - data.expense})
                .exec(res.render('qrcode/alertmessage',{username :req.session.user_info.user_info.username,title:'活動順利結束',msg:'出席名單已成功發送給【政大錢包】'}))
            });
        }
    });
};


//活動列表
exports.event_list = (req,res)=>{
    req.session.reload();
    Event.find({ $or : [{status : 'willhold'},{status : 'holding'}] })
    .populate('holder')
    .sort([['time','descending']])
    .exec((err,_event)=>{

        let timeArray = [];
        let endtimeArray = [];
        for(let i =0 ; i< _event.length;i++){
            timeArray.push(moment(_event[i].time).format('LLL'));
            endtimeArray.push(moment(_event[i].endtime).format('LLL'));
        }

        res.render('root/eventlist', {
            username : req.session.user_info.user_info.username,
            title: 'Event List | NCCU Attendance', 
            _event:  _event,
            Time :timeArray,
            endTime : endtimeArray
        });
    });
};

exports.grant_new_token = (req, res) => {
    req.session.reload();
    rp.post("http://wm.nccu.edu.tw:3001/oauth/access_token?grant_type='refresh_token'&refresh_token=" + req.session.API_Access.refresh_token)
    .then((data)=>{
        console.log(data);
    })
    .catch((err) =>{
        console.log(err);
    });
}
