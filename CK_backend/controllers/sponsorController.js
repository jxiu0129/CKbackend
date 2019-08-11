const Event = require("../models/event");
const sponsor = require("../models/sponsor");
const User = require("../models/user");

var async = require("async");

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// exports.sponsor = function(req,res){
//     res.render('index' , { title : "贊助商管理"});
// };

exports.sponsor_events= function(req,res){

    Event.find()
    //   .sort(['time','descending'])
      .exec(function (err, list_event){
         if (err) { return next(err); }
         // Successful, so render.
         res.render('sponsor/hostEvent', { title: 'My Events | NCCU Attendance', list_event:  list_event});
    });
    
};

exports.sponsor_create_get= function(req, res,){
    res.render('sponsor/addevents' , { title : "Add Events | NCCU Attendance"});
};


exports.sponsor_create_post = [

    //Validate
    body('name', 'Name is required').isLength({ min: 1 }).trim(),
    body('time',  'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    body('expense','Expense is required'),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    sanitizeBody('time').escape(),
    sanitizeBody('Expense').escape(),
 
    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        let event = new Event({
            // _id : req.body._id, 
            time : req.body.time,
            name : req.body.name,
            expense : req.body.expense      //投資點數
        });


        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('sponsor/addevents', { title: 'Add Events | NCCU Attendance', errors: errors.array()});
        return;
        }
        else {
            // Data from form is valid.

            // Save author.
            event.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect('events');
            })
        }
    }
];


exports.sponsor_delete_get= function(req,res){
    res.render('index' , { title : "刪除活動"});
};

exports.sponsor_delete_post= function(req,res){
    res.render('index' , { title : "刪除活動"});
};

exports.sponsor_update_get= function(req,res){
    res.render('index' , { title : "更改活動"});
};

exports.sponsor_update_post= function(req,res){
    res.render('index' , { title : "更改活動"});
};

exports.events_attendancelist = function(req,res){
    
    Event.find()
    .sort(['time','descending'])
    .exec(function (err, list_event){
       if (err) { return next(err); }
       // Successful, so render.
       res.render('sponsor/hostEvent', { title: 'My Events | NCCU Attendance', list_event:  list_event});
  });
    res.render('attendancelist' , { title : "Attendance List | NCCU Attendance"});

}

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