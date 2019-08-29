//const User = require("../models/user");
const Event = require("../models/event");
const Attendance = require('../models/attendance');
const async = require('async');


exports.user = function(req,res){
    res.render('index' , { title : "使用者管理"});
};

// connect to myrecords.ejs
// user routes 裡有個test 去上傳測試用資料
exports.user_record = (req,res, next) => {
    
    let event_list = [];

    Attendance.find({}, '_id name sign_in sign_out income', (err, data) => {
        if(err){ console.log(err); }
        console.log('here!!!=>'+data);
        if(data[0].name == null){
            let err = new Error('你還沒有參加任何活動喔');
            err.status = 404;
            return next(err);
        }

        for(let count of data){
            event_list.push(count._id);
        }

        console.log(event_list);
        res.render('user/myrecords', {event_info: data});
        // res.send('fuck');
    });

    // if(event_list[0]){
    //     for(let id of event_list){
    //         Event.findById(id, 'name time sponsor', (err, data) => {
    //             if(err){console.log(err);}
    //             console.log('data in loop => '+data);
    //             res.render('myrecords', {event_specific_info: data, id:id});
    //         });
    //     }
    // }
};

exports.user_events = function(req,res){
    res.render('index' , { title : "我的活動"});
};

// connect to myrecords.ejs