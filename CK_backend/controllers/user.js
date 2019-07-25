exports.user = function(req,res){
    res.render('index' , { title : "使用者管理"});
}

exports.user_record = function(req,res){
    res.render('index' , { title : "簽到/刷退狀況"});
}

exports.user_events = function(req,res){
    res.render('index' , { title : "我的活動"});
}