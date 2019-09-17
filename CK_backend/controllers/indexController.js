const rp = require('request-promise');
const request = require('request');
const Attendance = require("../models/attendance");
const Event = require("../models/event");

let API_LoginCode;
let API_Access;
let API_RefreshClock;
let API_User;

exports.index = function(req,res){
    // if(!req.session.code){
    //     res.render('index');
    // }
    // else{
    //     res.render('login_index');
    // }
    res.render('root/index');
};

exports.logout_but = (req, res) => {
    console.log('log out!');
    req.session.destroy();
}

exports.login_index = function(req, res){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.redirect("http://localhost:3000/");
    }else{
        rp.get('http://wm.nccu.edu.tw:3001/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://localhost:3000/login_index&code=' + API_LoginCode, function(req,res, body){
            API_Access = JSON.parse(body);
        })
        .catch(() => {
            console.log('wrong');
            console.log(API_Access);
            rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
                'auth': {
                    'bearer': API_Access.access_token
                }
            })
            .then((message) => {
                API_User = JSON.parse(message);
                console.log(API_User.user_info.sponsor_point);
                req.session.user_info = API_User;
                req.session.API_Access = API_Access;
                req.session.API_RefreshClock = Date.now();
                req.session.save();
    
                console.log(req.session.user_info);
            })
            .catch(() =>{
                console.log('fail');
            });
        });
        res.render('root/login_index');
    }
};

exports.profile_user = async function(req, res){
    res.render('root/profile');
};

let multipoint = {
    method: 'POST',
    uri: 'http://wm.nccu.edu.tw:3001/openapi/send_point',
    auth: {
        'bearer' : ''
    },
    body: {
        email: "",
	    to_accounts : [],
	    point : 0,
	    description : ''
    },
    json: true // Automatically stringifies the body to JSON
};

exports.Send_Multi_Point = async function(req, res){    
    let attndid;
    let list = [];
    let event_name;
    let point;
    let count=0;
    await Event.findById(req.params.eventid)
    .exec((err, data) => {
        if (err) { 
            console.log(err);
        }else{
            console.log(data.AttendanceList[0]);
            attndid = data.AttendanceList[0];
            event_name = data.name;
            point = data.expense;
            Attendance.findById(attndid)
            .exec((err, data) => {
                if (err){
                    console.log(err);
                }else{
                    for(let i = 0; i < data.list.length;i++)
                    {
                        if(data.list[i].reward == true){
                            list.push(data.list[i].email);
                            count++;
                        }
                    }
                }
                console.log(list);
                point = point / count;
                let sendpoint = multipoint;
                sendpoint.body.email = req.session.user_info.user_info.email;
                sendpoint.auth.bearer = req.session.API_Access.access_token;
                sendpoint.body.to_accounts = list;
                sendpoint.body.point = point;
                sendpoint.body.description = event_name;
                console.log(sendpoint);
                rp(sendpoint)
                .then((message) =>{
                    console.log(message);
                })
                .catch((err) =>{
                    console.log(err);
                });
            });
        }
    });
    res.render('qrcode/alertmessage',{title:'活動順利結束',msg:'出席名單已成功發送給【政大錢包】'});
};


//活動列表
exports.event_list = (req,res)=>{
    req.session.reload();
    Event.find({ $or : [{status : 'willhold'},{status : 'holding'}] })
    .populate('holder')
    .sort([['time','descending']])
    .exec((err,_event)=>{
        res.render('root/eventlist', { title: 'Event List | NCCU Attendance', _event:  _event});
    });
};