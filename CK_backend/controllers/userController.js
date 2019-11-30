const User = require("../models/user");
const Event = require("../models/event");
const Attendance = require('../models/attendance');
const async = require('async');


exports.user = function(req,res){
    res.render('root/index' , { title : "使用者管理"});
};

// connect to myrecords.ejs
// user routes 裡有個test 去上傳測試用資料

exports.user_record = async (req, res, next) => {
    await req.session.reload(err => {
        if (err){ 
            console.log('userRecord sess err', err);
        }
    });
    User
    .findOne({email:req.session.user_info.user_info.email}, 'attend email')
    .populate('attend.event_id')
    // .sort([['attend.event_id.time', 'descending']]) 
    .exec((err, data) => {
        if(err){ console.log(err); }
        // console.log('data ==>' + data);
        // console.log('data.attend ==>'+ data.attend);

        if(data.attend == null){
            let err = new Error('你還沒有參加任何活動喔');
            err.status = 404;
            return next(err);
        }


        res.render('user/myrecords', {
            event_info: data.attend, 
            username: req.session.user_info.user_info.name, 
            url:req.session.API_LoginCode
        });
    });
    
};

exports.user_events = function(req,res){
    res.render('root/index' , { title : "我的活動"});
};
// Albert
//eventinfo_record
exports.eventinfo_record = async (req,res)=>{
    await req.session.reload(err => {
        if (err){ 
            console.log('eventInfoRecord sess err', err);
        }
    });
    Event.findById(req.query.eventid,(err,event)=>{
        // console.log('EVENTINFO: ', event);
        res.render('user/eventinfo_record',{
            url:req.session.API_LoginCode,
            username:req.session.user_info.user_info.name,
            event : event,
        });
    });
};