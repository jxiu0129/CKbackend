const rp = require('request-promise');
const request = require('request');
const Event = require("../models/event");

let API_LoginCode;
let API_Access;
let API_RefreshClock;
let API_User;

exports.index = function(req,res){
    /*if(req.session.name == 'undefined'){
        res.render('index');
    }
    else{
        res.render('login_index');
    }*/
    res.render('root/index');
};

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

exports.Send_Multi_Point = (list, from, point, des, ApiToken) => {
    multipoint.body.email = from;
    multipoint.auth.bearer = ApiToken;
    multipoint.body.to_account.push(list);
    multipoint.body.point = point;
    multipoint.body.description = des;
    rp(multipoint)
    .then((message) =>{
        console.log(message);
    })
    .catch((err) =>{
        console.log(err);
    });
};


//活動列表
exports.event_list = (req,res)=>{
    req.session.reload();
    Event.find({ $or : [{status : 'willhold'},{status : 'holding'}] })
    .populate('holder')
    .sort([['time','descending']])
    .exec((err,_event)=>{
        res.render('eventlist', { title: 'Event List | NCCU Attendance', _event:  _event});
    });
};