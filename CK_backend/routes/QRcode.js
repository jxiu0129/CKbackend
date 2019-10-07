var express = require('express');
var router = express.Router();
var request = require('request');

const QRCode = require('qrcode');
const async = require("async");

const Attendance = require("../models/attendance");
const Event = require("../models/event");
const User = require("../models/user");


//QRCODE

/* GET QR page. */

// 掃描qrcode 並 簽到
router.get('/testSignIn/:eventid',async (req,res,next)=>{
    req.session.reload();
    if(req.session.user_info == undefined){
        res.render('qrcode/alertmessage',{username : req.session.user_info.user_info.name,title:'Please Log in',msg:'請先登入'});
    }else{
        
        async.parallel({
            user:function(callback){
                User.findOne({email : req.session.user_info.user_info.email})
                .exec(callback)
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
        
        async (err,results)=>{

            let _user = results.user;
            let U_atnd;
            let _stdId = req.session.user_info.user_info.email;
            let _timein = Date.now();
            let _atnd = results.attendance;
            let _SignIn;



            if(err){return next(err);}
            else if (String(results.event.holder) == String(_user._id)) {
                res.render('qrcode/alertmessage',{username : req.session.user_info.user_info.name,title:'',msg:'贊助商不可參加自己舉辦的活動'});
            }
            else if (_atnd == null){

                let _newSignIn = new Attendance({
                    event_id : req.params.eventid,
                    list : [{
                        email : _stdId,
                        time_in : _timein
                    }]
                });

                _SignIn = _newSignIn;

                _newSignIn.save(function(err){

                    if(err) {return next(err);}
                    console.log("Successfully Create SignIn");

                });
                
                let thisevent = new Event({
                    name : results.event.name,
                    time : results.event.time,
                    expense : results.event.expense,
                    location : results.event.location,
                    AttendanceList : _newSignIn,
                    amount : results.event.amount,
                    _id : results.event._id,
                    status : results.event.status,
                    ncculink : results.event.ncculink
                });
                // results.event.AttendanceList._id = _newSignIn._id

                Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
                    if(err) { return next(err);}
                });

                let user_atnd = {
                    event_id : req.params.eventid,
                    signin : _timein
                };

                _user.attend.push(user_atnd);

                User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                    if(err) { return next(err);}
                    else if (_user.inited == false){
                        res.render('qrcode/checkin(first)',{user : _user});
                    }else{
                        res.render('qrcode/checkin(second)',{user : _user});
                    }
                });
                
            }
        
            else{
                let _atndList = results.list.list;
                if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                    _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                        email : _stdId,
                        time_in : _timein
                    });
                    _SignIn = {
                        event_id : req.params.eventid,
                        list : _atndList,
                    };

                    Attendance.findByIdAndUpdate(_atnd._id,_SignIn,{},function(err){
                        console.log("Successfully Create SignIn 671");
                    });
                    
                    let user_atnd = {
                        event_id : req.params.eventid,
                        signin : _timein
                    };
    
                    _user.attend.push(user_atnd);
    
                    User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                        if(err) { return next(err);}
                        else if (_user.inited == false){
                            res.render('qrcode/checkin(first)',{user : _user});
                        }else{
                            res.render('qrcode/checkin(second)',{user : _user});
                        }
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
                                    time_in : _timein
                                });
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
                                res.render('qrcode/alertmessage',
                                {title: 'Already Signed In | NCCU Attendance',
                                msg: _user.name+' ,您已經簽到過囉！'});
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
                        console.log("Successfully Create SignIn");
                    });

                    await User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function (err,theuser) {
                        if(err){return next(err);}
                        console.log("Successfully Update User attend");
                    });

                    
                    const theAtd = await Attendance.findOne({event_id:req.params.eventid});

                    console.log("theAtd"+theAtd);
                    let _rwd = 0;
                    for ( let j = 0; j < theAtd.list.length ; j++){
                        if(theAtd.list[j].reward == true){
                             _rwd ++;
                        }
                    }

                    console.log("the_rwd"+_rwd);

                    let theevent = {
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _atnd._id,
                        _id : results.event._id,
                        amount : _rwd,
                        status : results.event.status,
                        ncculink : results.event.ncculink    
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        console.log("reward successfully update");
                        if (_user.inited == false){
                            res.render('qrcode/checkin(first)',{user : _user});
                        }else{
                            res.render('qrcode/checkin(second)',{user : _user});
                        }
                    });
                }
            }
        });
    }
});


// 掃描qrcode 並 刷退
router.get('/testSignOut/:eventid',async (req,res,next)=>{
    req.session.reload();

    if(req.session.user_info == undefined){
        res.render('qrcode/alertmessage',{title:'Please Log in',msg:'請先登入'});
    }else{
        async.parallel({
            user : function(callback){
                User.findOne({email:req.session.user_info.user_info.email})
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
        
        async (err,results) =>{

            let _stdId = req.session.user_info.user_info.email;
            let _timeout = Date.now();
            let _atnd = results.attendance;
            let _user = results.user;
            let U_atnd;
            let _SignOut;


            if(err){return next(err);}
            else if (String(results.event.holder) == String(_user._id)) {
                res.render('qrcode/alertmessage',{username : req.session.user_info.user_info.name,title:'',msg:'贊助商不可參加自己舉辦的活動'});
            }
            else if (_atnd == null){

                let _newSignOut = new Attendance({
                    event_id : req.params.eventid,
                    list : [{
                        email : _stdId,
                        time_out : _timeout
                    }]
                });

                _SignOut = _newSignOut;

                _newSignOut.save(function(err){

                    if(err) {return next(err);}
                    console.log("Successfully Create SignOut");

                });
                
                let thisevent = new Event({
                    name : results.event.name,
                    time : results.event.time,
                    expense : results.event.expense,
                    location : results.event.location,
                    AttendanceList : _newSignOut,
                    amount : results.event.amount,
                    _id : results.event._id,
                    status : results.event.status,
                    ncculink : results.event.ncculink
                });
                // results.event.AttendanceList._id = _newSignOut._id

                Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
                    if(err) { return next(err);}
                });

                let user_atnd = {
                    event_id : req.params.eventid,
                    signout : _timeout
                };

                _user.attend.push(user_atnd);

                User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                    if(err) { return next(err);}
                    res.render('qrcode/checkout',
                    {title: 'Successfully Sign Out | NCCU Attendance',
                    user : _user
                    });

                });
                console.log("here!!!"+theuser);
                
            }
        
            else{
                let _atndList = results.list.list;
                if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                    _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                        email : _stdId,
                        time_out : _timeout
                    });
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
                        res.render('qrcode/checkout',
                        {title: 'Successfully Sign Out | NCCU Attendance',
                        user : _user

                        });
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
                                _atndList.push({
                                    email : _stdId,
                                    time_out : _timeout
                                });
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
                            if (_atndList[i].time_out == undefined){                          //則檢查timein有沒有輸入過
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
                                res.render('qrcode/alertmessage',
                                {title: 'Already Signed Out | NCCU Attendance',
                                msg:_user.name + ' ,您已經刷退過囉！'});
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
                    for ( let j = 0; j < theAtd.list.length;j++){
                        if(theAtd.list[j].reward == true){
                            _rwd ++;
                        }
                    }

                    console.log(_rwd);

                    let theevent = {
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _atnd._id,
                        _id : results.event._id,
                        amount : _rwd,
                        status : results.event.status,
                        ncculink : results.event.ncculink    
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        res.render('qrcode/checkout',
                        {title: 'Successfully Sign Out | NCCU Attendance',
                        user : _user
                        });
                        console.log("reward successfully update");
                    });
                }
            }
        });
    }
});




//TIME TEST
const schedule = require('node-schedule');

router.get('/qrcodelist', (req,res,next)=>{
    req.session.reload();

    User.findOne({email : req.session.user_info.user_info.email},'name hold')
    .exec(async (err,thisuser)=>{
       
        if (err) { return next(err); };

        if (thisuser.hold.isHolder == false){
            res.render('qrcode/alertmessage',{title:'No Event',msg:thisuser.name+' ,您還沒有舉辦過任何活動哦！'});
        }else{
            
            let event_array = thisuser.hold.holded_events;
            // let timesup_event = [];
            // let _now = Date.now();
            // let timespan = 3600000;                         //時間差，目前是設定為一個小時
            
            // for (let i =0 ; i < event_array.length ; i++) {                       //檢查此user舉辦的所有活動，如果有一小時後開始的活動就把他push進timesup_event
            //     const evt = await Event.findById(event_array[i]);
            //     if ((evt.time - _now) <= timespan && evt.status != "finish"){
            //         timesup_event.push(event_array[i]);
            //     }
            // }

            Event.find({'$and' :[{_id : event_array},{status : 'holding'}]},'name shortid')
            .exec((err,EV) =>{
                if( EV[0] == null ){
                    res.render('qrcode/alertmessage',{title:'Not Yet',msg:'目前沒有即將進行的活動哦！\n (活動前一小時才會產生QRcode)'});
                }else{
                    res.render('qrcode/qrcodelist',{EV : EV});
                }
            });
        } 
    });
});

router.get('/tttest',async(req,res)=>{
    User.findByIdAndUpdate('5d807cc11c9d440000ac87e2',{inited:false,name:"徐子崴"})
    .exec((req,res)=>{
        console.log("DONE");
    });
});


router.get('/userinfo',(req,res)=>{
    req.session.reload();
    res.send(req.session.user_info);
    console.log('ui: '+req.session.user_info);
});

module.exports = router;
