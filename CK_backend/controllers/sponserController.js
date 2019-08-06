const Events = require("../models/event");
const Host = require("../models/host");
const User = require("../models/user");

var async = require("async");

// exports.sponser = function(req,res){
//     res.render('index' , { title : "贊助商管理"});
// };

exports.sponser_events= function(req,res){
    res.render('myevents' , { title : "我辦的活動"});
};

exports.sponser_create_get= function(req,res){
    res.render('index' , { title : "新增活動"});
};

exports.sponser_create_post= function(req,res){
    res.render('index' , { title : "新增活動"});
};

exports.sponser_delete_get= function(req,res){
    res.render('index' , { title : "刪除活動"});
};

exports.sponser_delete_post= function(req,res){
    res.render('index' , { title : "刪除活動"});
};

exports.sponser_update_get= function(req,res){
    res.render('index' , { title : "更改活動"});
};

exports.sponser_update_post= function(req,res){
    res.render('index' , { title : "更改活動"});
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