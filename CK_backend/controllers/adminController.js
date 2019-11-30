const Attendance = require("../models/attendance");
const Event = require("../models/event");
const User = require("../models/user");
const indexController = require("../controllers/indexController");

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

exports.admin_login_get = (req,res)=>{
    res.render('admin/login');
};

exports.admin_login_post = (req,res)=>{
    if (req.body.account == 'admin' && req.body.password == 'workhard') {
        req.session.admin = true;
        res.json({
            status: true
        });
    } else {
        res.json({
            status: false
        });
    }
};

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


exports.event_info = (req,res)=>{
    Event.findById(req.params.eventid)
    .populate('holder')
    .exec((err,event)=>{
            let Time = moment(event.time).format('LLL');
            let EndTime = moment(event.endtime).format('LLL');

        res.render('admin/eventinfo',{
            event : event,
            Time : Time,
            EndTime : EndTime,
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
            if(theuser == undefined | theuser == null){
              console.log("err: "+theuser);
              res.redirect('http://localhost:3000/admin/events/createevent_first');
            }else{
              res.redirect('/admin/events/createevent_second/'+theuser._id);
            }
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
            signCondition : req.body.signCondition,
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
            
            const qr_urlIN = 'http://localhost:3000/testsignin/'+event_id ;       //data的部分，此處的req.query先寫死
            const qr_pathIN = './public/images/QRcode/qrcode_'+event_id+"_in.jpg";
        
            QRCode.toFile(qr_pathIN, qr_urlIN, opts, (err) => {
                if (err) throw err;
                console.log('savedIN.');
            });
            
            const qr_urlOUT = 'http://localhost:3000/testsignout/'+event_id;           //data的部分
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

exports.event_update_post= [

  // //Validate
  // body('name', 'Name is required').isLength({ min: 1 }).trim(),
  // body('time',  'Invalid date').optional({ checkFalsy: true}).isISO8601(),
  // body('endtime',  'Invalid date').optional({ checkFalsy: true}).isISO8601(),
  // body('location', 'Name is required').isLength({ min: 1 }).trim(),
  // body('expense','Expense is required').isInt({ min : 0 ,allow_leading_zeroes: false}),

  // // Sanitize (trim) the name field.
  // sanitizeBody('name').escape(),
  // sanitizeBody('time').escape().toDate(),
  // sanitizeBody('endtime').escape().toDate(),
  // sanitizeBody('location').escape(),
  // sanitizeBody('Expense').escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create Author object with escaped and trimmed data (and the old id!)
      let event = {
          // _id : req.params._id, 
          name : req.body.name,
          time : req.body.time,
          endtime : req.body.endtime,
          location : req.body.location,
          ncculink : req.body.link,
          signCondition : req.body.signCondition,
      };
      if (req.body.time - Date.now() <= 3600000){
          event.status = 'holding';
      }
          // Data from form is valid. Update the record.
          Event.findByIdAndUpdate(req.query.eventid, event, {}, function (err, theevent) {
              if (err) { return next(err); }
              // Successful - redirect to genre detail page.
              console.log('Successfully Update');
              // ?????
              res.redirect("http://localhost:3000/admin/events");
          });
      
  }
];

exports.event_attendancelist = function(req,res,next){

  Event.findById(req.params.eventid)
  .populate('holder')
  .exec((err,theevt) =>{
      Attendance.findOne({event_id : req.params.eventid},'list')
      // .sort([['email','descending']])
      .exec(function (err, thisattnd){
          if (err) { return next(err); }

          res.render('admin/attendancelist', {title: 'Attendance List | NCCU Attendance', thisattnd : thisattnd, event :theevt} );
      });
  });
  
};

exports.Signin_create_get= function(req,res){
  res.render('admin/add_checkin' , { username: req.session.user_info.user_info.name,title : "Create Sign In | NCCU Attendance"});
};

exports.Signin_create_post= [

  (req,res,next) =>{
      body('time',  'Invalid date').isISO8601().custom((value) => {
          if (value < Date.now()){
              throw new Error('Cannot hold event in past!');
          }
          return true;
      });


      async.parallel({
          user : function(callback){
              User.findOne({email:req.body.email})
              .exec(callback);
          },
          event: function(callback){
              Event.findById(req.params.eventid)
              .exec(callback);
          },

          attendance: function(callback){
              Attendance.findOne({event_id:req.params.eventid})
              .exec(callback);

          },

          list : function(callback){
              Attendance.findOne({event_id:req.params.eventid},'list')
              .exec(callback);

          }
      },
      
      async (err,results) => {

          body('time',  'Invalid date').isISO8601().custom((value) => {
              if (value < Date.now()){
                  throw new Error('Cannot hold event in past!');
              }
              return true;
          });

          if(results.user == undefined){
              res.redirect('./SignInCreate');
              throw new Error("results.user is not defined");
          }
          let _stdId = req.body.email;
          let _timein = req.body.time;
          let _atnd = results.attendance;
          let _user = results.user;
          let U_atnd;
          let _SignIn;


          if(err){return next(err);}

          else if (_atnd == null){
              let _newSignIn;
              if(results.event.signCondition == 'onlyIn'){
                _newSignIn = new Attendance({
                    event_id : req.params.eventid,
                    list : [{
                        email : _stdId,
                        time_in : _timein,
                        reward:true
                    }]
                  });

                _newSignIn.save(function(err){
                  if(err) {return next(err);}
                  console.log("1.Successfully Create SignIn");
                });
                
                let _newSigin = _newSignIn;   //in In

                Event.findByIdAndUpdate(req.params.eventid,{amount :results.event.amount + 1,AttendanceList:_newSigin},{},function(err,theevent){
                  if(err) { return next(err);}
                  console.log("2.Succesfully update event.attendancelist");
                });
              }else{
                  _newSignIn = new Attendance({
                      event_id : req.params.eventid,
                      list : [{
                          email : _stdId,
                          time_in : _timein
                      }]
                  });

                  _newSignIn.save(function(err){
                    if(err) {return next(err);}
                    console.log("1.Successfully Create SignIn");
                });

                let _newSignin = _newSignIn;
                
                Event.findByIdAndUpdate(req.params.eventid,{amount :results.event.amount ,AttendanceList:_newSignin},{},function(err,theevent){
                    if(err) { return next(err);}
                    console.log("2.Succesfully update event.attendancelist");
                });
              }
                           
              let user_atnd = {
                  event_id : req.params.eventid,
                  signin : _timein
              };

              _user.attend.push(user_atnd);

              User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                  if(err) { return next(err);}
                  res.redirect("./attendancelist");
                  console.log("here!!!"+theuser);
              });

          }
      
          else{
              let _atndList = results.list.list;
              if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄 =>把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                  if (results.event.signCondition == 'onlyIn'){
                      _atndList.push({                   
                          email : _stdId,
                          time_in : _timein,
                          reward :true
                      });    
                  }else{
                      _atndList.push({                   
                          email : _stdId,
                          time_in : _timein
                      });    
                  }

                  _SignIn = {
                      event_id : req.params.eventid,
                      list : _atndList,
                  };

                  Attendance.findByIdAndUpdate(_atnd._id,_SignIn,{},function(err){
                      console.log("3. Successfully Create SignIn 671");
                  });
                  
              let user_atnd = {
                  event_id : req.params.eventid,
                  signin : _timein
              };

              _user.attend.push(user_atnd);

              User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                  if(err) { return next(err);}
                  res.redirect("./attendancelist");
              });
              console.log("here!!!"+theuser);

          }


              else{

                  for(let i = 0; i < _atndList.length; i++){
                      console.log("i:  "+i);
                      console.log(_atndList[i].email);


                      if(_stdId != _atndList[i].email){              //輸入的userid不等於目前檢查的studentId
                          if(i != _atndList.length-1){continue;}          //如果現在檢查的不是最後一個，那就繼續檢查，因為不在這筆代表可能在下面的別筆
                          else{
                              if(results.event.signCondition == 'onlyIn'){
                                  _atndList.push({
                                      email : _stdId,
                                      time_in : _timein,
                                      reward: true
                                  });    
                              }else{
                                  _atndList.push({
                                      email : _stdId,
                                      time_in : _timein
                                  });    
                              }

                              _SignIn = {
                                  event_id : req.params.eventid,
                                  list : _atndList,
                              };

                              U_atnd ={
                                  event_id : req.params.eventid,
                                  signin : _timein
                              };

                              _user.attend.push(U_atnd);

                              break;
                          }
                      }
                      
                      
                      
                      else if (_stdId == _atndList[i].email){                    //如果輸入的使用者id已經存在於紀錄中
                          if (_atndList[i].time_in == undefined){                          //則檢查timein有沒有輸入過
                              _atndList[i].time_in = _timein;
                              _atndList[i].reward = true;
                              _SignIn = {
                                  event_id : req.params.eventid,
                                  list : _atndList,
                              };

                              let _ind =_user.attend.map(x => x.event_id).indexOf(results.event._id);
                              _user.attend[_ind].signin= _timein;

                              break;

                          }else{
                              console.log("This User Has Already Signed In");
                              res.redirect('./SigninCreate');
                              return;
                          }
                      }else{
                          console.log("?");
                          break;
                      }
                  }
                  
                  console.log(_SignIn);

                  await Attendance.findByIdAndUpdate(results.attendance._id,_SignIn,{},function(err,theAtd){
                      if(err){return next(err);}
                      console.log("3. Successfully Create SignIn");
                  });

                  await User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function (err,theuser) {
                      if(err){return next(err);}
                      console.log("4. Successfully Update User attend");
                  });


                  const theAtd = await Attendance.findOne({event_id:req.params.eventid});

                  let _rwd = 0;
                  for ( let j = 0; j < theAtd.list.length;j++){
                      if(theAtd.list[j].reward == true){
                           _rwd ++;
                      }
                  }

                  console.log(_rwd);
                  
                  Event.findByIdAndUpdate(req.params.eventid,{AttendanceList:_atnd._id ,amount : _rwd,},{},function(err,theevent){
                      if(err) { return next(err);}
                      res.redirect("./attendancelist");
                   });

              }
          }
      });        
  }       
];

exports.Signout_create_get= function(req,res){
  res.render('admin/add_checkout' , { username: req.session.user_info.user_info.name,title : "Create Sign In | NCCU Attendance", url:req.session.API_LoginCode});
};

exports.Signout_create_post= [

  // Validate fields.
  body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim().custom((value, {req}) => {
      if(req.session.user_info.user_info.email == value){

      }
  }),

  // Sanitize fields.
  sanitizeBody('*').escape(),

  // Process request after validation and sanitization.
  (req,res,next) =>{

      async.parallel({
          user : function(callback){
              User.findOne({email:req.body.email})
              .exec(callback);
          },
          event: function(callback){
              Event.findById(req.params.eventid)
              .exec(callback)
          },

          attendance: function(callback){
              Attendance.findOne({event_id:req.params.eventid})
              .exec(callback)

          },

          list : function(callback){
              Attendance.findOne({event_id:req.params.eventid},'list')
              .exec(callback)

          }
      },
      
      async (err,results) => {
          if(results.user == undefined){
              res.redirect('./SignOutCreate');
              throw new Error("results.user is not defined");
          }

          let _stdId = req.body.email;
          let _timeout = req.body.time;
          let _atnd = results.attendance;
          let _user = results.user;
          let U_atnd;
          let _SignOut;

          if(err){return next(err);}

          else if (_atnd == null){
              let _newSignOut;
              if(results.event.signCondition == 'onlyOut'){
                  _newSignOut = new Attendance({
                      event_id : req.params.eventid,
                      list : [{
                          email : _stdId,
                          time_out : _timeout,
                          reward : true
                      }]
                  });  
                  
                  _newSignOut.save(function(err){
                    if(err) {return next(err);}
                    console.log("1.Successfully Create SignOut");
                  });
                  
                  let _newSigout = _newSignOut;   //out Out
  
                  Event.findByIdAndUpdate(req.params.eventid,{amount :results.event.amount + 1,AttendanceList:_newSigout},{},function(err,theevent){
                    if(err) { return next(err);}
                    console.log("2.Succesfully update event.attendancelist");
                  });
              }else{
                  _newSignOut = new Attendance({
                      event_id : req.params.eventid,
                      list : [{
                          email : _stdId,
                          time_out : _timeout
                      }]
                  });    
                 
                  _newSignOut.save(function(err){
                    if(err) {return next(err);}
                    console.log("1.Successfully Create SignOut");
                });

                let _newSignout = _newSignOut;
                
                Event.findByIdAndUpdate(req.params.eventid,{amount :results.event.amount ,AttendanceList:_newSignout},{},function(err,theevent){
                    if(err) { return next(err);}
                    console.log("2.Succesfully update event.attendancelist");
                });
              }

              let user_atnd = {
                  event_id : req.params.eventid,
                  signout : _timeout
              };

              _user.attend.push(user_atnd);

              User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                  if(err) { return next(err);}
                  res.redirect("./attendancelist");
                  console.log("here!!!"+theuser);
              });

          }
      
          else{
              let _atndList = results.list.list;
              if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                  if (results.event.signCondition == 'onlyOut'){
                      _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                          email : _stdId,
                          time_out : _timeout,
                          reward: true
                      });    
                  }else{
                      _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                          email : _stdId,
                          time_out : _timeout
                      });    
                  }

                  _SignOut = {
                      event_id : req.params.eventid,
                      list : _atndList,
                  };

                  Attendance.findByIdAndUpdate(_atnd._id,_SignOut,{},function(err){
                      console.log("Successfully Create SignOut");
                  });
                      
              let user_atnd = {
                  event_id : req.params.eventid,
                  signout : _timeout
              };

              _user.attend.push(user_atnd);

              User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                  if(err) { return next(err);}
                  res.redirect("./attendancelist");
              });
              console.log("here!!!"+theuser);

              }


              else{

                  for(let i = 0; i < _atndList.length; i++){
                      console.log("i:  "+i);
                      console.log(_atndList[i].email);


                      if(_stdId != _atndList[i].email){              //輸入的userid不等於目前檢查的studentId
                          if(i != _atndList.length-1){continue;}          //如果現在檢查的不是最後一個，那就繼續檢查，因為不在這筆代表可能在下面的別筆
                          else{
                              if(results.event.signCondition == 'onlyOut'){
                                  _atndList.push({
                                      email : _stdId,
                                      time_out : _timeout,
                                      reward:true
                                  });
                              }else{
                                  _atndList.push({
                                      email : _stdId,
                                      time_out : _timeout
                                  });
                              }    

                              _SignOut = {
                                  event_id : req.params.eventid,
                                  list : _atndList,
                              };

                              U_atnd ={
                                  event_id : req.params.eventid,
                                  signout : _timeout
                              };
                              _user.attend.push(U_atnd);

                              break;
                          }
                      }
                      
                      
                      
                      else if (_stdId == _atndList[i].email){                    //如果輸入的使用者id已經存在於紀錄中
                          if (_atndList[i].time_out == undefined){                          //則檢查timeout有沒有輸入過
                              _atndList[i].time_out = _timeout;
                              _atndList[i].reward = true;
                              _SignOut = {
                                  event_id : req.params.eventid,
                                  list : _atndList,
                              };
                              
                              let _ind =_user.attend.map(x => x.event_id).indexOf(results.event._id);
                              _user.attend[_ind].signout= _timeout;

                              break;
                              
                          }else{
                              console.log("This User Has Already Signed Out");
                              res.redirect('./SignOutCreate');
                              return;
                          }
                      }else{
                          console.log("?");
                          break;
                      }
                  }
                  
                  console.log(_SignOut);
                  
                  await Attendance.findByIdAndUpdate(results.attendance._id,_SignOut,{},function(err,theAtd){
                      if(err){return next(err);}
                      console.log("Successfully Create SignOut");
                  });

                  await User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function (err,theuser) {
                      if(err){return next(err);}
                      console.log("Successfully Update User attend");
                  });

                  const theAtd = await Attendance.findOne({event_id:req.params.eventid});

                  let _rwd = 0;
                  for (let j = 0; j < theAtd.list.length;j++){
                      if(theAtd.list[j].reward == true){
                          _rwd ++;
                      }
                  }
                  
                  console.log(_rwd);

                  Event.findByIdAndUpdate(req.params.eventid,{AttendanceList:_atnd._id ,amount : _rwd,},{},function(err,theevent){
                      if(err) { return next(err);}
                      res.redirect("./attendancelist");    
                  });                
              }
          }
      });
  }       
];

exports.Signboth_create_get= function(req,res){
  res.render('admin/add_checkinandout' , { username: req.session.user_info.user_info.name,title : "Create Sign In | NCCU Attendance", url:req.session.API_LoginCode});
};

exports.Signboth_create_post= [

  // Validate fields.
  // body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

  // Sanitize fields.
  // sanitizeBody('*').escape(),

  // Process request after validation and sanitization.
  (req,res,next) =>{
      async.parallel({
          user : function(callback){
              User.findOne({email:req.body.email})
              .exec(callback);
          },
          event: function(callback){
              Event.findById(req.params.eventid)
              .exec(callback)
          },

          attendance: function(callback){
              Attendance.findOne({event_id:req.params.eventid})
              .exec(callback)

          },

          list : function(callback){
              Attendance.findOne({event_id:req.params.eventid},'list')
              .exec(callback)

          }
      },
      
      async(err,results) => {
          if(results.user == undefined){
              res.redirect('./SignBothCreate');
              throw new Error("results.user is not defined");
          }

          let _stdId = req.body.email;
          let _timein = req.body.check_in_time;
          let _timeout = req.body.check_out_time;
          let _atnd = results.attendance;
          let _user = results.user;
          let U_atnd;
          let _Sign;


          if(err){return next(err);}

          else if (_atnd == null){

              let _newSign = new Attendance({
                  event_id : req.params.eventid,
                  list : [{
                      email : _stdId,
                      time_in : _timein,
                      time_out : _timeout,
                      reward : true
                  }]
              });

              _newSign.save(function(err){
                  if(err) {return next(err);}
                  console.log("Successfully Create SignIn and SignOut");
              });
              
              Event.findByIdAndUpdate(req.params.eventid,{amount:1,AttendanceList:_newSign},{},function(err,theevent){
                  if(err) { return next(err);}
              });
              
              let user_atnd = {
                  event_id : req.params.eventid,
                  signin : _timein,
                  signout : _timeout
              };

              _user.attend.push(user_atnd);

              User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                  if(err) { return next(err);}
                  res.redirect("./attendancelist");
                  console.log("here!!!"+theuser);
              });
              
          }
      
          else{
              let _atndList = results.list.list;
              if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                  _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                      email : _stdId,
                      time_in : _timein,
                      time_out : _timeout,
                      reward : true
                  });
                  _Sign = {
                      event_id : req.params.eventid,
                      list : _atndList,
                  };

                  Attendance.findByIdAndUpdate(_atnd._id,_Sign,{},function(err){
                      console.log("Successfully Create SignIn and SignOut");
                  });
                                                              
                  let user_atnd = {
                      event_id : req.params.eventid,
                      signin : _timein,
                      signout : _timeout
                  };

                  _user.attend.push(user_atnd);

                  User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                      if(err) { return next(err);}
                      console.log("here!!!"+theuser);
                  });

                  Event.findByIdAndUpdate(req.params.eventid,{amount:1,AttendanceList:_atnd._id},{},function(err,theevent){
                      if(err) { return next(err);}
                      res.redirect("./attendancelist");

                  });
              }


              else{

                  for(let i = 0; i < _atndList.length; i++){
                      console.log("i:  "+i);
                      console.log(_atndList[i].email);


                      if(_stdId != _atndList[i].email){              //輸入的userid不等於目前檢查的studentId
                          if(i != _atndList.length-1){continue;}          //如果現在檢查的不是最後一個，那就繼續檢查，因為不在這筆代表可能在下面的別筆
                          else{
                              _atndList.push({
                                  email : _stdId,
                                  time_in : _timein,
                                  time_out : _timeout,
                                  reward : true
                              });

                              _Sign = {
                                  event_id : req.params.eventid,
                                  list : _atndList,
                              };

                              U_atnd ={
                                  event_id : req.params.eventid,
                                  signin : _timein,
                                  signout : _timeout
                              };
                              _user.attend.push(U_atnd);

                              break;
                          }
                      }
                      
                      
                      
                      else if (_stdId == _atndList[i].email){                    //如果輸入的使用者id已經存在於紀錄中
                          if (_atndList[i].time_out != undefined && _atndList[i].time_in != undefined){                          //如果in跟out都已經輸入了
                              console.log("This user has already SignIn and SignOut");
                              res.redirect('./attendancelist');
                              return;
                          }else if (_atndList[i].time_in != undefined){     //如果in已經輸入過
                              console.log("This user has already SignIn ");
                              res.redirect('./attendancelist');
                              return;
                          }else if(_atndList[i].time_out != undefined){     //如果out已經輸入過
                              console.log("This user has already SignOut");
                              res.redirect('./attendancelist');
                              return;
                          }
                      }else{
                          console.log("?");
                          break;
                      }
                  }
                  console.log(_Sign);

                  await Attendance.findByIdAndUpdate(results.attendance._id,_Sign,{},function(err,theAtd){
                      if(err){return next(err);}
                      console.log("Successfully Create SingIn and SignOut");
                  });
                  
                  await User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function (err,theuser) {
                      if(err){return next(err);}
                      console.log("Successfully Update User attend");
                  });

                 
                  const theAtd = await Attendance.findOne({event_id:req.params.eventid});

                  let _rwd = 0;
                  for (let j = 0; j < theAtd.list.length;j++){
                      if(theAtd.list[j].reward == true){
                          _rwd ++;
                      }
                  }

                  console.log(_rwd);
                                   
                  Event.findByIdAndUpdate(req.params.eventid,{amount: _rwd,AttendanceList:_atnd._id},{},function(err,theevent){
                      if(err) { return next(err);}
                      res.redirect("./attendancelist");
                   });
              }
          }
      });
  }       
];

exports.check_delete_post = async(req,res,next)=>{
    let attd = await Attendance.findOne({event_id : req.params.eventid});
    let useremail = req.query.email;
    let user = await User.findOne({email : useremail});
    let event = await Event.findById(req.params.eventid);
    let list = attd.list;
    let user_attend = user.attend;

    let attd_num = list.map(x => x.email).indexOf(useremail);
    list.splice(attd_num,1);
    
    let user_num = user_attend.map(x => x.event_id).indexOf(req.params.eventid);
    user_attend.splice(user_num,1);

    let amount = event.amount -1;
    
    Attendance.findByIdAndUpdate(attd._id,{list : list})
    .exec((err)=>{
        if (err){return next(err);}
        console.log("Successfully update Attendance");
    });
    User.findByIdAndUpdate(user._id,{ attend: user_attend})
    .exec((err)=>{
        if (err){return next(err);}
        console.log("Successfully update User");
    });
    Event.findByIdAndUpdate(req.params.eventid,{amount : amount})
    .exec((err)=>{
        if (err){return next(err);}
        console.log("Successfully update Event");
    });

};

exports.user_create_get = (req,res)=>{
    res.render('admin/add_user' , {title : "Create Sign In | NCCU Attendance"});
};

exports.user_create_post = async (req,res)=>{
    let user = await User.findOne({email : req.body.email}); 
    if (!user) { 
        let _user = new User( {
            email : req.body.email,
            inited : false,
            name : req.body.name,
            hold : {
                isHolder : false,
                holded_events : [],
            },
            spendedAmount : 0,
            attend : [],
        });

        _user.save();
        console.log("Successfully Create User");
        res.redirect('../');

    }else if(user){
        console.log('This User has already in DB of NCCU attendance');
        res.render('admin/add_user');
    }
};


//////////////////////////////  User Part   /////////////////////////////////////////////////////////////


exports.user_list = (req,res)=>{
    User.find({})
    // .populate('hold')
    // .populate('attend')
    .sort([['email','descending']])
    .exec((err,user)=>{
        res.render('admin/userlist',{user : user});
    });
};

exports.user_info = (req,res)=>{
    User.findById(req.params.userid)
    .exec((err,user)=>{
        res.render('admin/userinfo',{user:user});
    });
};

exports.user_record = (req, res, next) => {
    User
    .findById(req.params.userid, 'attend email')
    .populate('attend.event_id')
    .exec((err, data) => {
        if(err){ console.log(err); }

        if(data.attend == null){
            let err = new Error('你還沒有參加任何活動喔');
            err.status = 404;
            return next(err);
        }


        res.render('admin/userrecord', {
            event_info: data.attend, 
            user:data
        });
    });
    
};

exports.user_holded = (req,res) =>{
    User.findById(req.params.userid)
    .exec((err,_user)=>{
        if (err) { return next(err); }
        
        Event.find({_id:_user.hold.holded_events})
        .sort([['time','descending']])
        .exec((err,list_event) => {
            if (err) { return next(err); }
            let timeArray = [];
            let endtimeArray = [];
            for(let i =0 ; i< list_event.length;i++){
                timeArray.push(moment(list_event[i].time).format('LLL'));
                endtimeArray.push(moment(list_event[i].endtime).format('LLL'));
            }

            res.render('admin/userevents', {
                _user : _user,
                list_event:  list_event,
                Time : timeArray,
                endTime : endtimeArray, 
            });
        });      
    });
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