const rp = require('request-promise');
const request = require('request');
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
    res.render('index');
};

exports.login_index = function(req, res){
    console.log('location.code : ' + req.query.code);
    API_LoginCode = req.query.code;
    req.session.API_LoginCode = req.query.code;
    if(!req.session.API_LoginCode){
        console.log('wrong dude');
        res.redirect("http://localhost:3000/");
    }
    else {}
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
            console.log(message);
            console.log(API_User.user_info.sponsor_point);
            req.session.user_info = API_User;
            req.session.API_Access = API_Access;
            req.session.save();
        })
        .catch(() =>{
            console.log('fail');
        });
    });
    res.render('login_index');
};

exports.profile_user = async function(req, res){
    res.render('profile');
};

let multipoint = {
    method: 'POST',
    uri: 'http://wm.nccu.edu.tw:3001/openapi/send_point',
    body: {
        list: []
    },
    json: true // Automatically stringifies the body to JSON
};

exports.Send_Multi_Point = (list, from, point, des) => {
    multipoint.list.email = from;
    multipoint.list.to_account.push(list);
    multipoint.list.point = point;
    multipoint.list.description = des;
    rp(multipoint)
    .then((message) =>{
        console.log(message);
    })
    .catch((err) =>{
        console.log(err);
    });

};
