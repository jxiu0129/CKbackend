exports.index = function(req,res){
    if(req.session.name == 'undefined'){
        res.render('index');
    }
    else{
        res.render('login_index');
    }
};

exports.user_login_post = function(req,res){
    res.redirect('../user');  //Test
};

exports.sponsor_login_post = function(req,res){
    res.redirect('../sponsor');   //Test
};