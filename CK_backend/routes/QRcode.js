var express = require('express');
var router = express.Router();
var request = require('request');
const http = require('http');

const QRCode = require('qrcode');
const async = require("async");

const rp = require('request-promise');
const Attendance = require("../models/attendance");
const Event = require("../models/event");
const User = require("../models/user");

const sponsor_controller = require('../controllers/sponsorController');

//QRCODE

/* GET QR page. */

// 掃描qrcode 並 簽到

router.get('/testSignIn/:eventid',async (req,res,next)=>{
    req.session.reload();

    if(req.session.user_info == undefined){
        res.redirect('http://localhost:3000/QRin_nologin/'+req.params.eventid);
    }else{
        await sponsor_controller.SignToRecord(req,res,req.params.eventid,'In')
        .then(() => {
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
                    res.render('qrcode/alertmessage',{username : req.session.user_info.user_info.name,title:'',msg:'贊助商不可參加自己舉辦的活動', url:req.session.API_LoginCode});
                }
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
                    }else{
                        _newSignIn = new Attendance({
                            event_id : req.params.eventid,
                            list : [{
                                email : _stdId,
                                time_in : _timein
                            }]
                        });
                    }

                    _SignIn = _newSignIn;

                    _newSignIn.save(function(err){

                        if(err) {return next(err);}
                        console.log("Successfully Create SignIn");

                    });
                    
                    let thisevent;
                    if(results.event.signCondition == 'onlyIn'){
                        thisevent = new Event({
                            name : results.event.name,
                            time : results.event.time,
                            expense : results.event.expense,
                            location : results.event.location,
                            AttendanceList : _newSignIn,
                            amount : results.event.amount + 1,
                            _id : results.event._id,
                            status : results.event.status,
                            ncculink : results.event.ncculink,
                            signCondition : results.event.signCondition
                        });    
                    }else{
                        thisevent = new Event({
                            name : results.event.name,
                            time : results.event.time,
                            expense : results.event.expense,
                            location : results.event.location,
                            AttendanceList : _newSignIn,
                            amount : results.event.amount,
                            _id : results.event._id,
                            status : results.event.status,
                            ncculink : results.event.ncculink,
                            signCondition : results.event.signCondition
                        });
                    }

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
                            res.render('qrcode/checkin(first)',{username:req.session.user_info.user_info.name,user : _user});
                        }else{
                            res.render('qrcode/checkin(second)',{username:req.session.user_info.user_info.name, user : _user});
                        }
                    });
                    
                }
            
                else{
                    let _atndList = results.list.list;
                    if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
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
                                res.render('qrcode/checkin(first)',{username:req.session.user_info.user_info.name,user : _user});
                            }else{
                                res.render('qrcode/checkin(second)',{username:req.session.user_info.user_info.name,user : _user});
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
                                    res.render('qrcode/alertmessage',
                                    {title: 'Already Signed In | NCCU Attendance',
                                    username:req.session.user_info.user_info.name,
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
                            ncculink : results.event.ncculink , 
                            signCondition : results.event.signCondition 
                        };
                        
                        Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                            if(err) { return next(err);}
                            console.log("reward successfully update");
                            if (_user.inited == false){
                                res.render('qrcode/checkin(first)',{username:req.session.user_info.user_info.name,user : _user});
                            }else{
                                res.render('qrcode/checkin(second)',{username:req.session.user_info.user_info.name,user : _user});
                            }
                        });
                    }
                }
            });
        });
    }
});

// 掃描qrcode 並 刷退
router.get('/testSignOut/:eventid',async (req,res,next)=>{
    req.session.reload();

    if(req.session.user_info == undefined){
        res.redirect('http://localhost:3000/QRout_nologin/'+req.params.eventid);
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
                res.render('qrcode/alertmessage',{username : req.session.user_info.user_info.name,title:'',msg:'贊助商不可參加自己舉辦的活動', url:req.session.API_LoginCode});
            }
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
                }else{
                    _newSignOut = new Attendance({
                        event_id : req.params.eventid,
                        list : [{
                            email : _stdId,
                            time_out : _timeout
                        }]
                    });    
                }

                _SignOut = _newSignOut;

                _newSignOut.save(function(err){

                    if(err) {return next(err);}
                    console.log("Successfully Create SignOut");

                });
                
                let thisevent;
                if(results.event.signCondition == 'onlyOut'){
                    thisevent = new Event({
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _newSignOut,
                        amount : results.event.amount + 1,
                        _id : results.event._id,
                        status : results.event.status,
                        ncculink : results.event.ncculink,
                        signCondition : results.event.signCondition
                    });    
                }else{
                    thisevent = new Event({
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _newSignOut,
                        amount : results.event.amount,
                        _id : results.event._id,
                        status : results.event.status,
                        ncculink : results.event.ncculink,
                        signCondition : results.event.signCondition
                    });    
                }


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
                    username:req.session.user_info.user_info.name,
                    user : _user
                    });

                });
                console.log("here!!!"+theuser);
                
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
                        res.render('qrcode/checkout',
                        {title: 'Successfully Sign Out | NCCU Attendance',
                        username:req.session.user_info.user_info.name,
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
                        ncculink : results.event.ncculink,
                        signCondition : results.event.signCondition       
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        res.render('qrcode/checkout',
                        {title: 'Successfully Sign Out | NCCU Attendance',
                        username:req.session.user_info.user_info.name,
                        user : _user
                        });
                        console.log("reward successfully update");
                    });
                }
            }
        });
    }
});

//登入的跳轉
//登入簽到
let login_checkin = async function(req, res, next){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.render('root/index');
    }else{
        rp.get('https://points.nccu.edu.tw/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://localhost:3000/QRin_login/'+req.params.eventid+'&code=' + API_LoginCode, function(req,res, body){
            API_Access = JSON.parse(body);
        })
        .catch(async () => {
            console.log('wrong');
            console.log(API_Access);
            await rp.get('https://points.nccu.edu.tw/openapi/user_info', {
                'auth': {
                    'bearer': API_Access.access_token
                }
            })
            .then(async(message) => {
                API_User = JSON.parse(message);
                console.log(API_User.user_info.sponsor_point);
                req.session.user_info = API_User;
                req.session.API_Access = API_Access;
                req.session.API_RefreshClock = Date.now();
                req.session.API_LoginCode = API_LoginCode;
                req.session.save();
    
                console.log(req.session.user_info);
            
                // 新用戶登入後在資料庫新增資料
                let user = await User.findOne({email : req.session.user_info.user_info.email});
                console.log(user);
                if (!user) { 
                    let _user =new User( {
                        email : req.session.user_info.user_info.email,
                        inited : false,
                        name : req.session.user_info.user_info.name,
                        hold : {
                            isHolder : false,
                            holded_events : [],
                        },
                        spendedAmount : 0,
                        attend : [],
                    });

                    _user.save();

                }else if(user){
                    console.log('This User has already in DB of NCCU attendance');
                    if(user.name != req.session.user_info.user_info.name){
                        User.findByIdAndUpdate(user._id,{name:req.session.user_info.user_info.name})
                        .exec((err)=>{
                            console.log("Update User name");
                        });
                    }
                }

            })
            .catch(() =>{
                console.log('fail');
            });
            console.log(req.session.API_LoginCode);
            // res.redir('root/login_index', { username : API_User.user_info.name, url:req.session.API_LoginCode});
            res.redirect('http://localhost:3000/testSignIn/'+req.params.eventid);
        });
    }
};

//登入刷退
let login_checkout = async function(req, res, next){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.render('root/index');
    }else{
        rp.get('https://points.nccu.edu.tw/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://localhost:3000/QRout_login/'+req.params.eventid+'&code=' + API_LoginCode, function(req,res, body){
            API_Access = JSON.parse(body);
        })
        .catch(async () => {
            console.log('wrong');
            console.log(API_Access);
            await rp.get('https://points.nccu.edu.tw/openapi/user_info', {
                'auth': {
                    'bearer': API_Access.access_token
                }
            })
            .then(async(message) => {
                API_User = JSON.parse(message);
                console.log(API_User.user_info.sponsor_point);
                req.session.user_info = API_User;
                req.session.API_Access = API_Access;
                req.session.API_RefreshClock = Date.now();
                req.session.API_LoginCode = API_LoginCode;
                req.session.save();
    
                console.log(req.session.user_info);
            
                // 新用戶登入後在資料庫新增資料
                let user = await User.findOne({email : req.session.user_info.user_info.email});
                console.log(user);
                if (!user) { 
                    let _user =new User( {
                        email : req.session.user_info.user_info.email,
                        inited : false,
                        name : req.session.user_info.user_info.name,
                        hold : {
                            isHolder : false,
                            holded_events : [],
                        },
                        spendedAmount : 0,
                        attend : [],
                    });

                    _user.save();

                }else if(user){
                    console.log('This User has already in DB of NCCU attendance');
                    if(user.name != req.session.user_info.user_info.name){
                        User.findByIdAndUpdate(user._id,{name:req.session.user_info.user_info.name})
                        .exec((err)=>{
                            console.log("Update User name");
                        });
                    }
                }

            })
            .catch(() =>{
                console.log('fail');
            });
            console.log(req.session.API_LoginCode);
            // res.redir('root/login_index', { username : API_User.user_info.name, url:req.session.API_LoginCode});
            res.redirect('http://localhost:3000/testSignOut/'+req.params.eventid);
        });
    }
};

router.get('/QRin_login/:eventid',login_checkin);
router.get('/QRout_login/:eventid',login_checkout);

router.get('/QRin_nologin/:eventid',(req,res)=>{
    console.log(123);
    res.render('qrcode/checkin_nolog',{eventid:req.params.eventid});
});

router.get('/QRout_nologin/:eventid',(req,res)=>{
    console.log(456);
    res.render('qrcode/checkout_nolog',{eventid:req.params.eventid});
});



//TIME TEST
const schedule = require('node-schedule');

router.get('/qrcodelist', (req,res,next)=>{
    req.session.reload();

    User.findOne({email : req.session.user_info.user_info.email},'name hold')
    .exec(async (err,thisuser)=>{
       
        if (err) { return next(err); };

        if (thisuser.hold.isHolder == false){
            res.render('qrcode/alertmessage',{title:'No Event',msg:thisuser.name+' ,您還沒有舉辦過任何活動哦！',
            username : req.session.user_info.user_info.name,
            url:req.session.API_LoginCode
        });
        }else{
            
            let event_array = thisuser.hold.holded_events;

            Event.find({'$and' :[{_id : event_array},{status : 'holding'}]},'name shortid signCondition')
            .exec((err,EV) =>{
                if( EV[0] == null ){
                    res.render('qrcode/alertmessage',{title:'Not Yet',msg:'目前沒有即將進行的活動哦！\n (活動前一小時才會產生QRcode)',
                    username : req.session.user_info.user_info.name,
                    url:req.session.API_LoginCode
                });
                }else{
                    res.render('qrcode/qrcodelist',{EV : EV,
                        username : req.session.user_info.user_info.name,
                        url:req.session.API_LoginCode
                    });
                }
            });
        } 
    });
});

var shortUrl = require('node-url-shortener');

const fs = require('fs');
const moment = require('moment');
const json2csv = require('json2csv').parse;
const path = require('path');
// const fields = ['name','email','time_in','time_out'];

router.get('/ttest',(req,res)=>{
    Attendance.findOne({event_id:'5d9d8f2e53de890b5cf82510'}, function (err, attd) {
        console.log(attd);
        let email_in_atd = attd.list.map(x=>x.email);
        User.find({email:email_in_atd},function(err,user){
            console.log(user);
        });
    });
});

router.get('/tttest',async (req,res)=>{

    Attendance.findOne({event_id:'5dbff4b7d1352a36488c805d'}, function (err, attd) {
        if (err) {
          return res.status(500).json({ err });
        }

        else {
            let email_in_atd = attd.list.map(x=>x.email);
                let user;
                list = attd.list;
                for (let i =0; i <list.length ; i++){
                    User.findOne({email:list[i].email},(err,_user)=>{
                        user = _user;
                    });
                    console.log(user);
                    list[i] = {
                        email : list[i].email,
                        time_in : list[i].time_in,
                        time_out : list[i].time_out,
                        name : user[i].name
                    };
                }
                console.log(list);
                try {
                  csv = json2csv(list, {fields,withBOM:true});
                } catch (err) {
                  return res.status(500).json({ err });
                }
                const dateTime = moment().format('YYYYMMDDhhmmss');
                const filePath = path.join(__dirname, "..", "public", "csv-" + dateTime + ".csv")
                fs.writeFile(filePath, csv, function (err) {
                  if (err) {
                    return res.json(err).status(500);
                  }
                  else {
                    setTimeout(function () {
                      fs.unlinkSync(filePath); // delete this file after 30 seconds
                    }, 300000);
                    return res.json("/csv-" + dateTime + ".csv");
                  }
                });      
        }
      });
    });

const fields = ['email', 'time_in','time_out'];
    
router.get('/exportCSV/:eventid', function (req, res) {
    Attendance.findOne({event_id:req.params.eventid}, async (err, attd) => {
    if (err) {
        return res.status(500).json({ err });
    }
    else {
        let csv;
        let list = attd.list;
        try {
        csv = json2csv(list, { fields });
        } 
        catch (err) {
        return res.status(500).json({ err });
        }
        const dateTime = moment().format('YYYYMMDDhhmmss');
        const filePath = path.join(__dirname, "..", "public", "csv-" + dateTime + ".csv");

        await fs.writeFile(filePath, csv, (err) => {
        if (err) {
            return res.json(err).status(500);
        }
        else {
            setTimeout(() => {
                fs.unlinkSync(filePath); // delete this file after 30 seconds
            }, 30000);
            // res.json("/exports/csv-" + dateTime + ".csv");
            res.download(filePath, () => {console.log('success download');});
        }
        });

    }
    });
});


router.get('/userinfo',(req,res)=>{
    req.session.reload();
    res.send(req.session.user_info);
    console.log('ui: '+req.session.user_info);
});

module.exports = router;