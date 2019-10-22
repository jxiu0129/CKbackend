const Attendance = require("../models/attendance");
const Event = require("../models/event");
const User = require("../models/user");

let API_LoginCode;
let API_Access;
let API_RefreshClock;
let API_User;

const fs = require("fs");
const async = require("async");
const request = require('request');
const QRCode = require('qrcode');
const schedule = require('node-schedule');
const moment = require('moment');


const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

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


exports.admin = function(req,res){
    res.render('admin/index');
};

exports.event_list = function(req,res){
    Event.find({})
    .populate('holder')
    .sort([['time','descending']])
    .exec((err,_event)=>{

        let timeArray = [];
        let endtimeArray = [];
        for(let i =0 ; i< _event.length;i++){
            timeArray.push(moment(_event[i].time).format('LLL'));
            endtimeArray.push(moment(_event[i].endtime).format('LLL'));
        }

        res.render('admin/eventlist', {
            _event:  _event,
            Time :timeArray,
            endTime : endtimeArray,
            url:req.session.API_LoginCode
        });
    });
};

exports.create_event_first_get = function(req,res){
    res.render('admin/addevent_first');
};

exports.create_event_first_post =[
    (req,res)=>{
        let email = req.body.email;
        User.findOne({email:email})
        .exec((err,theuser)=>{
            if (err) { return next(err); }
            res.redirect('/admin/events/createevent_second/'+theuser._id);
        });
    }
];

exports.create_event_second_get = function(req,res){
    User.findById(req.params.userid)
    .exec((err,theuser)=>{
        if (err) { return next(err); }
        res.render('admin/addevent_second',{user:theuser});
    });
};

exports.create_event_second_post = [
    
    // //Validate
    // // req.session.reload();
    // body('name', 'Name is required').isLength({ min: 1 }).trim(),
    // body('time',  'Invalid date').isISO8601().custom((value) => {
    //     if (value < Date.now()){
    //         throw new Error('Cannot hold event in past!');
    //     }
    //     return true;
    // }),
    // body('endtime',  'Invalid date').isISO8601().custom((value) => {
    //     if (value < Date.now()){
    //         throw new Error('Cannot hold event in past!');
    //     }
    //     return true;
    // }),
    // body('location', 'Name is required').isLength({ min: 1 }).trim(),
    // // body('expense','Expense is required').isInt().custom((value, {req}) => {
    // //     if(value < 0){
    // //         console.log("Problem3");
    // //         throw new Error('Expense must be Positive');
    // //     }else if(value > req.session.user_info.user_info.sponsor_point){
    // //         console.log("Problem4");
    // //         throw new Error("You don't have enough money");
    // //     }
    // //     return true;
    // // }),    
    // // Sanitize (trim) the name field.
    // sanitizeBody('name').escape(),
    // sanitizeBody('time').escape().toDate(),
    // sanitizeBody('endtime').escape().toDate(),
    // sanitizeBody('location').escape(),
    // // sanitizeBody('expense').escape(),

    // // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        // const errors = validationResult(req);
        
        // if (req.session.user_info.user_info.sponsor_point < req.body.expense ){
        //     console.log("餘額不足");   
        // };
        // Create a genre object with escaped and trimmed data.
        let _user = await User.findById(req.params.userid);
        
        let event = new Event({
            // _id : req.body._id, 
            holder : _user._id,
            name : req.body.name,
            time : req.body.time,
            endtime : req.body.endtime,
            location : req.body.location,
            expense : req.body.expense,      //投資點數
            amount : 0,
            ncculink : req.body.event_link,
        });
        if (event.time -  Date.now() <= 3600000){
            event.status = 'holding';
        }

        // if (!errors.isEmpty()) {
        //     // Test
        //     console.log("Error : "+errors);
        // return;
        // }
        else {
 
            // First, Create QR code jpg                           
            let event_id = event._id;          //find的條件理應是找目前正在舉辦的event，因為正常來說這個其實是一個array
            
            const opts = {                                    //容錯率包含QRcode圖片的大小，若把太大的圖片硬縮成小圖就會增加讀取錯誤率
                errorCorrectionLevel: 'H',                    //version越高，圖片能包含的data也就越多   
                version: 10                                    //但別太高
            };
            
            const qr_urlIN = 'http://attend.nccu.edu.tw/testsignin/'+event_id ;       //data的部分，此處的req.query先寫死
            const qr_pathIN = './public/images/QRcode/qrcode_'+event_id+"_in.jpg";
        
            QRCode.toFile(qr_pathIN, qr_urlIN, opts, (err) => {
                if (err) throw err;
                console.log('savedIN.');
            });
            
            const qr_urlOUT = 'http://attend.nccu.edu.tw/testsignout/'+event_id;           //data的部分
            const qr_pathOUT = './public/images/QRcode/qrcode_'+event_id+"_out.jpg";
        
    
            QRCode.toFile(qr_pathOUT, qr_urlOUT, opts, (err) => {
                if (err) throw err;
                console.log('savedOUT.');
            });

            // Second, Data from form is valid, Save
            await event.save(function (err) {
                if (err) { return next(err); }
                console.log('Successfully Create Event');
            });

            User.findById(req.params.userid)
            .exec((err,theuser) => {
                theuser.hold.holded_events.push(event._id);
                let _holdedEvents = theuser.hold.holded_events;
                let _spendedAmount = Number(theuser.spendedAmount) + Number(req.body.expense);
                User.findByIdAndUpdate(theuser._id, {spendedAmount: _spendedAmount , hold: { isHolder : true, holded_events : _holdedEvents}})
                .exec(res.redirect('../'));
            });
        }
    }
];

exports.event_delete_post = async (req,res,next) => {
  async.parallel({
      user : function(callback){
          User.findById(req.query.userid)
          .exec(callback);
      },
      event : function(callback){
          Event.findById(req.query.eventid)
          .exec(callback);
      },
      attendance: function(callback){
          Attendance.findOne({event_id:req.query.eventid})
          .exec(callback);
      },    
  },
  async (err,results)=>{
      console.log("query U:"+req.query.userid);
      console.log("query E:"+req.query.eventid);
      let theevt = results.event;
      let theuser = results.user;
      let theatd = results.attendance;
      let _spendedAmount = Number(theuser.spendedAmount) - Number(theevt.expense);
      console.log("AAAA"+_spendedAmount);
      
      Event.findByIdAndRemove(req.query.eventid, function deleteEvent(err,evt) {
          if (err) { return next(err); }
          console.log("Successfully Delete Event");
      });

      if (theatd != null){
          let ATD = theatd.list.map(x => x.email);

          for (let i =0 ;i < ATD.length ; i++){
              await User.findOne({email:ATD[i]},'attend')
              .exec(async(err,us)=>{
                  
                  let US = us.attend.map(x => x.event_id).indexOf(req.query.eventid);
  
                  if (US == -1){
                      console.log("return");
                      return;
                  }else{
                      us.attend.splice(US,1);
                      await User.findByIdAndUpdate(us._id,{attend : us.attend});
                  }
              });            
          }
          console.log("Successfully Update User.attend");
  
          Attendance.findOneAndRemove({event_id:req.query.eventid},(err,theAtd)=>{
              if(err){console.log(err);}
              else{console.log("Successfully Delete Attendance");}
          });
      }

      if (theuser.hold.holded_events.indexOf(req.query.eventid) != -1){
          let _holdedEvents = theuser.hold.holded_events;
          
          _holdedEvents.splice(_holdedEvents.indexOf(req.query.eventid),1);
          
          if(_holdedEvents.length == 0){
              User.findByIdAndUpdate(theuser._id, {spendedAmount:_spendedAmount,hold: { isHolder : false, holded_events : _holdedEvents}})
              .exec(res.redirect('./'));
              console.log("Successfully Update User.hold (false)");    
          }else if (_holdedEvents.length > 0){
              User.findByIdAndUpdate(theuser._id, {spendedAmount:_spendedAmount,hold: { isHolder : true, holded_events : _holdedEvents}})
              .exec(res.redirect('./'));    
              console.log("Successfully Update User.hold (true)");    
          }
      }
      else {res.redirect('./');}

      fs.unlink('./public/images/QRcode/qrcode_' +req.query.eventid+'_in.jpg',(err)=>{
          if(err){console.log(err)}
          else{console.log("Successfully Delete QRcode_in.jpg")}
      });

      fs.unlink('./public/images/QRcode/qrcode_' +req.query.eventid+'_out.jpg',(err)=>{
          if(err){console.log(err)}
          else{console.log("Successfully Delete QRcode_out.jpg")}
      } );

  });
};

exports.check_create_get= function(req,res){
    res.render('index' , { title : "新增簽到/刷退"});
};

exports.check_create_post= function(req,res){
    res.render('index' , { title : "新增簽到/刷退"});
};

exports.check_delete_get= function(req,res){
    res.render('index' , { title : "刪除簽到/刷退"});
};

exports.check_delete_post= function(req,res){
    res.render('index' , { title : "刪除簽到/刷退"});
};

exports.check_update_get= function(req,res){
    res.render('index' , { title : "更改簽到/刷退"});
};

exports.check_update_post= function(req,res){
    res.render('index' , { title : "更改簽到/刷退"});
};

exports.user_events = function(req,res){
    res.render('index' , { title : "使用者資料"});
};

exports.sponsor_events = function(req,res){
    res.render('index' , { title : "贊助商資料"});
};

exports.all_events = function(req,res){
    res.render('index' , { title : "活動資料"});
};