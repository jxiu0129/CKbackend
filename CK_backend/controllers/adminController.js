exports.admin = function(req,res){
    res.render('index' , { title : "管理員介面"});
};

exports.check_create_get= function(req,res){
    res.render('index' , { title : "新增簽到/刷退"});
};

exports.check_create_post= function(req,res){
    res.render('index' , { title : "新增簽到/刷退"});
};

exports.check_delete_get= function(req,res){
    res.render('index' , { title : "刪除簽到/刷退"});
};

exports.check_delete_post= function(req,res){
    res.render('index' , { title : "刪除簽到/刷退"});
};

exports.check_update_get= function(req,res){
    res.render('index' , { title : "更改簽到/刷退"});
};

exports.check_update_post= function(req,res){
    res.render('index' , { title : "更改簽到/刷退"});
};

exports.user_events = function(req,res){
    res.render('index' , { title : "使用者資料"});
};

exports.sponser_events = function(req,res){
    res.render('index' , { title : "贊助商資料"});
};

exports.all_events = function(req,res){
    res.render('index' , { title : "活動資料"});
};