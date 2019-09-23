const Event = require("../models/event");
const User = require("../models/user");
const Attendance = require("../models/attendance");

const fs = require("fs");
const async = require("async");
const request = require('request');
const QRCode = require('qrcode');


const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

//----------------------------網站自動執行功能---------------------------
// 1.自動更新status(活動開始前為willhold,活動時間一到改為holding,按下活動結束成為finish)
Event.find({status : 'willhold'},'_id status time')
.exec(async(err,list_event)=>{
    console.log(list_event);        
    for(let i =0; i < list_event.length ; i++){
        if(Date.now() >= list_event[i].time){
            console.log(i);                
            await Event.findByIdAndUpdate(list_event[i]._id,{ status :'holding'});
        }
    }
});




exports.sponsor_events= async(req,res,next) =>{

    req.session.reload();
    
    User.findOne({email:req.session.user_info.user_info.email})
    .exec(async (err,_user)=>{
        if (err) { return next(err); }
        
        Event.find({_id:_user.hold.holded_events},'_id shortid name time location expense amount status')
        .sort([['time','descending']])
        .exec(async (err,list_event) => {
            if (err) { return next(err); }
            // Successful, so render.
            res.render('sponsor/myevents', { title: 'My Events | NCCU Attendance', list_event:  list_event});

                    
        });
    });    
};

exports.sponsor_create_get= function(req, res,){
    req.session.reload();
    console.log(req.session.user_info.user_info.sponsor_point);
    res.render('sponsor/addevents' , { title : "Add Events | NCCU Attendance",balance:req.session.user_info.user_info.sponsor_point});
};


exports.sponsor_create_post = [
    
    //Validate
    // req.session.reload();
    body('name', 'Name is required').isLength({ min: 1 }).trim(),
    body('time',  'Invalid date').isISO8601().custom((value) => {
        if (value < Date.now()){
            throw new Error('Cannot hold event in past!');
        }
        return true;
    }),
    body('location', 'Name is required').isLength({ min: 1 }).trim(),
    body('expense','Expense is required').isInt().custom((value, {req}) => {
        if(value < 0){
            console.log("Problem3");
            throw new Error('Expense must be Positive');
        }else if(value > req.session.user_info.user_info.sponsor_point){
            console.log("Problem4");
            throw new Error("You don't have enough money");
        }
        return true;
    }),    
    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    sanitizeBody('time').escape().toDate(),
    sanitizeBody('location').escape(),
    sanitizeBody('expense').escape(),
    
    // Process request after validation and sanitization.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        console.log(req.session.user_info.user_info.sponsor_point);
        const errors = validationResult(req);
        
        // if (req.session.user_info.user_info.sponsor_point < req.body.expense ){
        //     console.log("餘額不足");   
        // };
        // Create a genre object with escaped and trimmed data.
        let _user = await User.findOne({email:req.session.user_info.user_info.email});

        let event = new Event({
            // _id : req.body._id, 
            holder : _user._id,
            name : req.body.name,
            time : req.body.time,
            location : req.body.location,
            expense : req.body.expense,      //投資點數
            amount : 0,
            ncculink : req.body.event_link,
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('sponsor/addevents', { title: 'Add Events | NCCU Attendance', balance : 'defined your mother' , errors: errors.array()});
            // Test
            console.log("Error : "+errors);
        return;
        }
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

            User.findOne({email:req.session.user_info.user_info.email})
            .exec((err,theuser) => {
                theuser.hold.holded_events.push(event._id);
                let _holdedEvents = theuser.hold.holded_events;
                User.findByIdAndUpdate(theuser._id, {hold: { isHolder : true, holded_events : _holdedEvents}})
                .exec(res.redirect('./'));
            });
        }
    }
];



exports.sponsor_delete_post= async (req,res,next) => {

            req.session.reload();

            await Event.findByIdAndRemove(req.params.eventid, function deleteEvent(err,theevt) {
                if (err) { return next(err); }
                console.log("Successfully Delete Event");
            });

            await Attendance.findOne({event_id : req.params.eventid},'list')
            .exec(async(err,atd)=>{
                if (err) { return next(err); }

                let ATD = atd.list.map(x => x.email);
        
                for (let i =0 ;i < ATD.length ; i++){
                    await User.findOne({email:ATD[i]},'attend')
                    .exec(async(err,us)=>{
                        
                        let US = us.attend.map(x => x.event_id).indexOf(req.params.eventid);
        
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
            });

            //沒有寫檢查的機制，照理來說應該是先檢查attendancelist存不存在才能刪，但莫名的無論存不存在他都會刪所以都可以跑，先這樣寫好了               

            await Attendance.findOneAndRemove({event_id:req.params.eventid},(err,theAtd)=>{
                if(err){console.log(err);}
                else{console.log("Successfully Delete Attendance");}
            });

            await User.findOne({email:req.session.user_info.user_info.email})
            .exec((err,theuser) => {
                if (theuser.hold.holded_events.indexOf(req.params.eventid) != -1){
                    let _holdedEvents = theuser.hold.holded_events;

                    _holdedEvents.splice(_holdedEvents.indexOf(req.params.eventid),1);
                    
                    if(_holdedEvents.length == 0){
                        User.findByIdAndUpdate(theuser._id, {hold: { isHolder : false, holded_events : _holdedEvents}})
                        .exec(res.redirect('../'));
                        console.log("Successfully Update User.hold (false)");    
                    }else if (_holdedEvents.length > 0){
                        User.findByIdAndUpdate(theuser._id, {hold: { isHolder : true, holded_events : _holdedEvents}})
                        .exec(res.redirect('../'));    
                        console.log("Successfully Update User.hold (true)");    
                    }
                }
                else {res.redirect('../');}
            });

            fs.unlink('./public/images/QRcode/qrcode_' +req.params.eventid+'_in.jpg',(err)=>{
                if(err){console.log(err)}
                else{console.log("Successfully Delete QRcode_in.jpg")}
            });

            fs.unlink('./public/images/QRcode/qrcode_' +req.params.eventid+'_out.jpg',(err)=>{
                if(err){console.log(err)}
                else{console.log("Successfully Delete QRcode_out.jpg")}
            } );

        };

exports.sponsor_update_post= [

    //Validate
    body('name', 'Name is required').isLength({ min: 1 }).trim(),
    body('time',  'Invalid date').optional({ checkFalsy: true}).isISO8601(),
    body('location', 'Name is required').isLength({ min: 1 }).trim(),
    body('expense','Expense is required').isInt({ min : 0 ,allow_leading_zeroes: false}),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    sanitizeBody('time').escape().toDate(),
    sanitizeBody('location').escape(),
    sanitizeBody('Expense').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        let event = {
            // _id : req.params._id, 
            time : req.body.time,
            name : req.body.name,
            location : req.body.location
        };

            // Data from form is valid. Update the record.
            Event.findByIdAndUpdate(req.params.eventid, event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../");
            });
        
    }
];

exports.events_attendancelist = function(req,res,next){

    Event.findById(req.params.eventid)
    .populate('holder')
    .exec((err,theevt) =>{
        Attendance.findOne({event_id : req.params.eventid},'list')
        // .sort([['email','descending']])
        .exec(function (err, thisattnd){
            if (err) { return next(err); }
            // Successful, so render.
            console.log(theevt);
            console.log(thisattnd);
            res.render('sponsor/attendancelist', { title: 'Attendance List | NCCU Attendance', thisattnd : thisattnd, event :theevt } );
        });
    });
    
};

exports.SignIn_create_get= function(req,res){
    res.render('sponsor/add_checkin_record' , { title : "Create Sign In | NCCU Attendance"});
};

exports.SignIn_create_post= [

    // Validate fields.
    // body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    // sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req,res,next) =>{
        console.log("????"),   
        req.session.reload();


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
                    _id : results.event._id
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
                    res.redirect("./attendancelist");
                });
                console.log("here!!!"+theuser);

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
                        console.log("Successfully Create SignIn");
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
                        amount : _rwd
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        res.redirect("./attendancelist");
                     });

                }
            }
        });        
    }       
];

exports.SignOut_create_get= function(req,res){
    res.render('sponsor/add_checkout_record' , { title : "Create Sign Out | NCCU Attendance"});
};

exports.SignOut_create_post= [

    // Validate fields.
    // body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    // sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req,res,next) =>{
        console.log("????"),
        req.session.reload();


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
                    res.redirect("./attendancelist");
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
                    };
                    
                    console.log(_rwd);

                    let theevent = {
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _atnd._id,
                        _id : results.event._id,
                        amount : _rwd
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        res.redirect("./attendancelist");    
                    });                
                }
            }
        })
    }       
];

exports.SignBoth_create_get= function(req,res){
    res.render('sponsor/add_checkinandout_record' , { title : "Create Sign In / Sign Out | NCCU Attendance"});
};

exports.SignBoth_create_post= [

    // Validate fields.
    // body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    // sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req,res,next) =>{
        console.log("????"),
        req.session.reload();


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
            let _timein = req.body.timein;
            let _timeout = req.body.timeout;
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

                _Sign = _newSign;

                _newSign.save(function(err){

                    if(err) {return next(err);}
                    console.log("Successfully Create SignIn and SignOut");

                });
                
                let thisevent = new Event({
                    name : results.event.name,
                    time : results.event.time,
                    expense : results.event.expense,
                    location : results.event.location,
                    AttendanceList : _newSign,
                    _id : results.event._id,
                    amount : 1
                });
                // results.event.AttendanceList._id = _newSignOut._id

                Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
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
                });
                console.log("here!!!"+theuser);
                
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
                    let thisevent = new Event({
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _newSign,
                        _id : results.event._id,
                        amount : 1
                    });
                    // results.event.AttendanceList._id = _newSignOut._id
                                                
                    let user_atnd = {
                        event_id : req.params.eventid,
                        signin : _timein,
                        signout : _timeout
                    };

                    _user.attend.push(user_atnd);

                    User.findByIdAndUpdate(_user._id,{attend : _user.attend},{},function(err,theuser){
                        if(err) { return next(err);}
                    });

                    console.log("here!!!"+theuser);

                    Event.findByIdAndUpdate(req.params.eventid,thisevent,{},function(err,theevent){
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
                    };

                    console.log(_rwd);
                    
                    let theevent = {
                        name : results.event.name,
                        time : results.event.time,
                        expense : results.event.expense,
                        location : results.event.location,
                        AttendanceList : _atnd._id,
                        _id : results.event._id,
                        amount : _rwd
                    };
                    
                    Event.findByIdAndUpdate(req.params.eventid,theevent,{},function(err,theevent){
                        if(err) { return next(err);}
                        res.redirect("./attendancelist");
                     });
                }
            }
        })
    }       
];
