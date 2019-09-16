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
    
    User
    .findById(req.query._id, 'attend')
    // using http://localhost:3000/user/record?_id=5d70d857107eb226b4b8f770 for test
    // .populate('hold.holded_events')
    .populate('attend.event_id')
    .exec((err, data) => {
        if(err){ console.log(err); }
        console.log('here!!!=>'+ data.attend);

        if(data._id == null){
            let err = new Error('你還沒有參加任何活動喔');
            err.status = 404;
            return next(err);
        }


        res.render('user/myrecords', {event_info: data.attend});
        // res.send('fuck');
        // res.send(data);
    });
    
};

exports.user_events = function(req,res){
    res.render('root/index' , { title : "我的活動"});
};

// connect to myrecords.ejs