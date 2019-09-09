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
//原本是到這個頁面就會create一個新的QRcode.jpg，但因為在新增活動時就會create圖片，所以這邊要改成直接get要顯示的圖片
router.get('/qrlist/:sponsorid', function(req, res, next) {

    User.findById(req.params.sponsorid)
    .exec((err,theuser)=>{                              
        let event_id = theuser.hold.holded_events;          //find的條件理應是找目前正在舉辦的event，因為正常來說這個其實是一個array
    
        const opts = {                                    //容錯率包含QRcode圖片的大小，若把太大的圖片硬縮成小圖就會增加讀取錯誤率
            errorCorrectionLevel: 'H',                    //version越高，圖片能包含的data也就越多   
            version: 10                                    //但別太高
        };
        
        const qr_urlIN = 'http://localhost:3000/testsignin/'+event_id+'?userid=777';           //data的部分
        const qr_pathIN = './public/images/QRcode/qrcode_'+event_id+"_in.jpg";
    
        QRCode.toFile(qr_pathIN, qr_urlIN, opts, (err) => {
            if (err) throw err;
            console.log('savedIN.');
        });
        
        const qr_urlOUT = 'http://localhost:3000/testsignout/'+event_id+'?userid=777';           //data的部分
        const qr_pathOUT = './public/images/QRcode/qrcode_'+event_id+"_out.jpg";
    

        QRCode.toFile(qr_pathOUT, qr_urlOUT, opts, (err) => {
            if (err) throw err;
            console.log('savedOUT.');
        });

        res.render('qrcode/qrcodelist',
        {qr_pathIN : '../images/QRcode/qrcode_'+ event_id +'_in.jpg' , 
        qr_pathOUT : '../images/QRcode/qrcode_'+ event_id +'_out.jpg'});
    });

});

// 掃描qrcode 並 簽到
router.get('/testSignIn/:eventid',(req,res,next)=>{

        async.parallel({
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
        
        function(err,results){

            let _stdId = req.session.user_info.user_info.student_id;
            let _timein = Date.now();
            let _atnd = results.attendance;
            let _SignIn;


            if(err){return next(err);}

            else if (_atnd == null){

                let _newSignIn = new Attendance({
                    event_id : req.params.eventid,
                    list : [{
                        student_id : _stdId,
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
                    _id : results.event._id
                })
                // results.event.AttendanceList._id = _newSignIn._id

                Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
                    if(err) { return next(err);}
                    res.render('qrcode/alertmessage',
                    {title: 'Successfully Sign In | NCCU Attendance',
                    msg:'簽到成功'})
                });
                
            }
        
            else{
                let _atndList = results.list.list;
                if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                    _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                        student_id : _stdId,
                        time_in : _timein
                    });
                    _SignIn = {
                        event_id : req.params.eventid,
                        list : _atndList,
                    };

                    Attendance.findByIdAndUpdate(_atnd._id,_SignIn,{},function(err){
                        console.log("Successfully Create SignIn 671");
                        res.render('qrcode/alertmessage',
                        {title: 'Successfully Sign In | NCCU Attendance',
                        msg:'簽到成功'})
                    })
                }


                else{

                    for(let i = 0; i < _atndList.length; i++){
                        console.log("i:  "+i);
                        console.log(_atndList[i].student_id);


                        if(_stdId != _atndList[i].student_id){              //輸入的userid不等於目前檢查的studentId
                            if(i != _atndList.length-1){continue;}          //如果現在檢查的不是最後一個，那就繼續檢查，因為不在這筆代表可能在下面的別筆
                            else{
                                _atndList.push({
                                    student_id : _stdId,
                                    time_in : _timein
                                });
                                _SignIn = {
                                    event_id : req.params.eventid,
                                    list : _atndList,
                                };
                                break;
                            }
                        }
                        
                        
                        
                        else if (_stdId == _atndList[i].student_id){                    //如果輸入的使用者id已經存在於紀錄中
                            if (_atndList[i].time_in == undefined){                          //則檢查timein有沒有輸入過
                                _atndList[i].time_in = _timein;
                                _atndList[i].reward = true;
                                _SignIn = {
                                    event_id : req.params.eventid,
                                    list : _atndList,
                                };
                                break;
                            }else{
                                console.log("This User Has Already Signed In");
                                res.render('qrcode/alertmessage',
                                {title: 'Already Signed In | NCCU Attendance',
                                msg:'這個使用者ID已經簽到過囉！'})
                                return;
                            }
                        }else{
                            console.log("?");
                            break;
                        }
                    }
                    console.log(_SignIn);
                    Attendance.findByIdAndUpdate(results.attendance._id,_SignIn,{},function(err,theAtd){
                        if(err){return next(err);}
                        console.log("Successfully Create SignIn");
                        res.render('qrcode/alertmessage',
                        {title: 'Successfully Sign In | NCCU Attendance',
                        msg:'簽到成功'})
                    })
                }
            }
        }) 
});


// 掃描qrcode 並 刷退
router.get('/testSignOut/:eventid',(req,res,next)=>{
    async.parallel({
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
    
    function(err,results){

        let _stdId = req.query.userid;
        let _timeout = Date.now();
        let _atnd = results.attendance;
        let _SignOut;


        if(err){return next(err);}

        else if (_atnd == null){

            let _newSignOut = new Attendance({
                event_id : req.params.eventid,
                list : [{
                    student_id : _stdId,
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
                _id : results.event._id
            })
            // results.event.AttendanceList._id = _newSignOut._id

            Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
                if(err) { return next(err);}
                res.render('qrcode/alertmessage',
                {title: 'Successfully Sign Out | NCCU Attendance',
                msg:'刷退成功'});

            });
            
        }
    
        else{
            let _atndList = results.list.list;
            if(_atndList.length == 0){             //有建立attendance但裡面沒有任何紀錄
                _atndList.push({                   //把這筆紀錄塞進去然後update，這樣這筆attendance就有紀錄了
                    student_id : _stdId,
                    time_out : _timeout
                });
                _SignOut = {
                    event_id : req.params.eventid,
                    list : _atndList,
                };

                Attendance.findByIdAndUpdate(_atnd._id,_SignOut,{},function(err){
                    console.log("Successfully Create SignOut");
                    res.render('qrcode/alertmessage',
                    {title: 'Successfully Sign Out | NCCU Attendance',
                    msg:'刷退成功'});
                })
            }


            else{

                for(let i = 0; i < _atndList.length; i++){
                    console.log("i:  "+i);
                    console.log(_atndList[i].student_id);


                    if(_stdId != _atndList[i].student_id){              //輸入的userid不等於目前檢查的studentId
                        if(i != _atndList.length-1){continue;}          //如果現在檢查的不是最後一個，那就繼續檢查，因為不在這筆代表可能在下面的別筆
                        else{
                            _atndList.push({
                                student_id : _stdId,
                                time_out : _timeout
                            });
                            _SignOut = {
                                event_id : req.params.eventid,
                                list : _atndList,
                            };
                            break;
                        }
                    }
                    
                    
                    
                    else if (_stdId == _atndList[i].student_id){                    //如果輸入的使用者id已經存在於紀錄中
                        if (_atndList[i].time_out == undefined){                          //則檢查timein有沒有輸入過
                            _atndList[i].time_out = _timeout;
                            _atndList[i].reward = true;
                            _SignOut = {
                                event_id : req.params.eventid,
                                list : _atndList,
                            };
                            break;
                        }else{
                            console.log("This User Has Already Signed Out");
                            res.render('qrcode/alertmessage',
                            {title: 'Already Signed Out | NCCU Attendance',
                            msg:'這個使用者ID已經刷退過囉！'});
                            return;
                        }
                    }else{
                        console.log("?");
                        break;
                    }
                }
                console.log(_SignOut);
                Attendance.findByIdAndUpdate(results.attendance._id,_SignOut,{},function(err,theAtd){
                    if(err){return next(err);}
                    console.log("Successfully Create SignOut");
                    res.render('qrcode/alertmessage',
                    {title: 'Successfully Sign Out | NCCU Attendance',
                    msg:'刷退成功'});
                });
            }
        }
    });
});





//////////////////////////////////////////////////////////////
//Test : new一個user
router.post('/createuser',(req,res,next)=>{

    // Create a genre object with escaped and trimmed data.
    let user = new User({
        name : req.body.name,
        hold:{
            isHolder : req.body.isholder,
            holded_events : req.body.eventid
        }
    });


        // Data from form is valid, Save
        user.save(function (err) {
            if (err) { return next(err); }
            // Successful - redirect to new author record.
            res.redirect('./');
            console.log('Successfully Create');
        });
    
});

//////////////////////////////////////////////////////////
router.get('/QRtest', function(req, res, next) {
    //理應這裡要用req.params.userid
    User.findById('5d6eb21f4839c50f085196e4')
    .exec((err,theuser)=>{                              
        let event_id = theuser.hold.holded_events;          //find的條件理應是找目前正在舉辦的event
    
        const opts = {                                    //容錯率包含QRcode圖片的大小，若把太大的圖片硬縮成小圖就會增加讀取錯誤率
            errorCorrectionLevel: 'H',                    //version越高，圖片能包含的data也就越多   
            version: 10                                    //但別太高
        };
        
        const qr_urlIN = 'https://www.youtube.com/watch?v=hHW1oY26kxQ';           //data的部分
        const qr_pathIN = './public/images/QRcode/qrcode_'+event_id+"_in.jpg";
    
        QRCode.toFile(qr_pathIN, qr_urlIN, opts, (err) => {
            if (err) throw err;
            console.log('savedIN.');
        });
        
        const qr_urlOUT = 'https://www.youtube.com/watch?v=NbNPJr_0tqA';           //data的部分
        const qr_pathOUT = './public/images/QRcode/qrcode_'+event_id+"_out.jpg";
    

        QRCode.toFile(qr_pathOUT, qr_urlOUT, opts, (err) => {
            if (err) throw err;
            console.log('savedOUT.');
        });

        res.render('qrcode/qrtest',
        {qr_pathIN : './images/QRcode/qrcode_'+ event_id +'_in.jpg' , 
        qr_pathOUT : './images/QRcode/qrcode_'+ event_id +'_out.jpg'
    });
    });
});

//TIME TEST
const schedule = require('node-schedule');

router.get('/qrcodelist/:userid', (req,res,next)=>{
    console.log(req.session.user_info);
    User.findById(req.params.userid,'hold')
    .exec(async (err,thisuser)=>{
       
        if (err) { return next(err); };

        if (thisuser.hold.isHolder == false){
            res.render('qrcode/alertmessage',{title:'No Event',msg:'這個使用者沒有舉辦過任何活動哦！'});
        }else{
            
            let event_array = thisuser.hold.holded_events;
            let timesup_event = [];
            let _now = Date.now();
            let timespan = 3600000;                         //時間差，目前是設定為一個小時
            
            for (let i =0 ; i < event_array.length ; i++) {                       //檢查此user舉辦的所有活動，如果有一小時後開始的活動就把他push進timesup_event
                const evt = await Event.findById(event_array[i]);
                if ((evt.time - _now) <= timespan){
                    timesup_event.push(event_array[i]);
                }
            };

            console.log(timesup_event);

            if( timesup_event[0] == null ){
                res.render('qrcode/alertmessage',{title:'Not Yet',msg:'目前沒有即將進行的活動哦！\n (活動前一小時才會產生QRcode)'});
            }else{
                res.render('qrcode/qrcodelist',{timesup_event : timesup_event});
            }
        } 
    });
});


router.get('/timeTest',(req,res,next)=>{
    let _date = new Date(Date.now());
    console.log(_date);
    let A = [];
    let B = [0,1,2,3,4]
    for (b of B){
        A.push(b);
        console.log(A);
    }
    console.log(A);

});



module.exports = router;
