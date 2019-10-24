const User = require("../models/user");
const Event = require("../models/event");
const Attendance = require('../models/attendance');
const async = require('async');


exports.user = function(req,res){
    res.render('root/index' , { title : "使用者管理"});
};

// connect to myrecords.ejs
// user routes 裡有個test 去上傳測試用資料

exports.user_record = (req, res, next) => {
    req.session.reload();
    console.log('session HERE --->' + req.session.user_info.user_info.email);
    User
    .findOne({email:req.session.user_info.user_info.email}, 'attend email')
    .populate('attend.event_id')
    // .sort([['attend.event_id.time', 'descending']]) 
    .exec((err, data) => {
        if(err){ console.log(err); }
        console.log('data ==>'+data);
        console.log('data.attend ==>'+ data.attend);

        if(data.attend == null){
            let err = new Error('你還沒有參加任何活動喔');
            err.status = 404;
            return next(err);
        }


        res.render('user/myrecords', {event_info: data.attend, username: req.session.user_info.user_info.name, url:req.session.API_LoginCode});
        // res.send('fuck');
        // res.send(req.session);
    });
    
};

exports.user_events = function(req,res){
    res.render('root/index' , { title : "我的活動"});
};

// connect to myrecords.ejs