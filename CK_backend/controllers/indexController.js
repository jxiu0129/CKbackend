const request = require('request');

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

    res.render('login_index');
};

// exports.user_login_post = function(req,res){
//     res.redirect('../user');  //Test
// };

// exports.sponsor_login_post = function(req,res){
//     res.redirect('../sponsor');   //Test
// };

exports.user_login = function(req,res){
    req = request('http://wm.nccu.edu.tw:3001/oauth/authorize/response_type=code&client_id=bcdhjsbcjsdbc&redirect_uri=http://localhost:3000&state=123');
    res.render(req);
};
