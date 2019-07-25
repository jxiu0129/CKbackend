exports.index = function(req,res){
    res.render('index' , { title : "政大辦活動"});
}

exports.user_login_post = function(req,res){
    res.redirect('../user');        //Test
}

exports.sponser_login_post = function(req,res){
    res.redirect('../sponser');        //Test
}