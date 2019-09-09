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

    rp.get('http://wm.nccu.edu.tw:3001/oauth/access_token?grant_type=access_token&client_id=bcdhjsbcjsdbc&redirect_uri=http://localhost:3000/login_index&code=' + API_LoginCode, function(req,res, body){
        API_Access = JSON.parse(body);
    })
    .catch(() => {
        console.log('wrong');
        console.log(API_Access);
        console.log(API_Access.access_token);
        console.log(API_Access.refresh_token);
        rp.get('http://wm.nccu.edu.tw:3001/openapi/user_info', {
            'auth': {
                'bearer': API_Access.access_token
            }
        })
        .then((message) => {
            console.log(message);
            API_User = message;
        })
        .catch(() =>{
            console.log('fail');
        });
        req.session.user_info = API_User;
        req.session.API_Access = API_Access;
    });
    res.render('login_index');
};

exports.profile_user = async function(req, res){
    res.render('profile');
} 

// exports.user_login_post = function(req,res){
//     res.redirect('../user');  //Test
// };

// exports.sponsor_login_post = function(req,res){
//     res.redirect('../sponsor');   //Test
// };

