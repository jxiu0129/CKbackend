const Event = require("../models/event");
const Sponsor = require("../models/sponsor");
//const User = require("../models/User");

var async = require("async");

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


exports.sponsor_events= function(req,res,next){

    Event.find({},'_id name time expense')
      .sort([['time','descending']])
      .exec(function (err, list_event){
         if (err) { return next(err); }
         // Successful, so render.
         console.log(list_event);
         res.render('sponsor/myevents', { title: 'My Events | NCCU Attendance', list_event:  list_event});
    });
    
};

exports.sponsor_create_get= function(req, res,){
    res.render('sponsor/addevents' , { title : "Add Events | NCCU Attendance"});
};


exports.sponsor_create_post = [

    //Validate
    body('name', 'Name is required').isLength({ min: 1 }).trim(),
    body('time',  'Invalid date').optional({ checkFalsy: true}).isISO8601(),
    body('expense','Expense is required').isInt({ min : 0 ,allow_leading_zeroes: false}),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    sanitizeBody('time').escape().toDate(),
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
            // Test
            console.log("Error : "+errors);
        return;
        }
        else {
            // Data from form is valid, Save
            event.save(function (err) {
                if (err) { return next(err); }
                // Successful - redirect to new author record.
                res.redirect('./');
                console.log('Successfully Create');
            })
        }
    }
];



exports.sponsor_delete_post= function(req,res,next){

    async.parallel({
        event: function (callback) {
            Event.findById(req.body.eventid).exec(callback)
        },
        sponsor_event: function (callback) {
            Sponsor.find({ 'events': req.body.eventid }).exec(callback)
        },
    }, function (err, results) {
        if (err) { return next(err); }
        // Success.
        else {
            console.log(results.event);
            console.log(results.sponsor_event);
            // Author has no books. Delete object and redirect to the list of authors.
            Event.findByIdAndRemove(req.body.eventid, function deleteEvent(err) {
                if (err) { return next(err); }
                // Success - go to author list.
                console.log("Successfully Delete");
                res.redirect('../');
            });

        }
    
    });
   
};

exports.sponsor_update_post= [

    //Validate
    body('name', 'Name is required').isLength({ min: 1 }).trim(),
    body('time',  'Invalid date').optional({ checkFalsy: true}).isISO8601(),
    body('expense','Expense is required').isInt({ min : 0 ,allow_leading_zeroes: false}),

    // Sanitize (trim) the name field.
    sanitizeBody('name').escape(),
    sanitizeBody('time').escape().toDate(),
    sanitizeBody('Expense').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create Author object with escaped and trimmed data (and the old id!)
        let event = {
            // _id : req.params._id, 
            time : req.body.time,
            name : req.body.name,
            expense : req.body.expense      //投資點數
        };

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values and error messages.
            res.render('sponsor/addevents1', { title: 'Update Events | NCCU Attendance', errors: errors.array()});
            return;
        }
        else {
            // Data from form is valid. Update the record.
            Event.findByIdAndUpdate(req.params.eventid, event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../");
            });
        }
    }
];

exports.events_attendancelist = function(req,res,next){

    Event.findById(req.params.eventid)
      .exec(function (err, list_attendance){
         if (err) { return next(err); }
         // Successful, so render.
         console.log(list_attendance);
         res.render('sponsor/attendancelist', { title: 'Attendance List | NCCU Attendance', list_attendance : list_attendance } );
    })
    
    };

exports.check_create_get= function(req,res){
    res.render('sponsor/addrecord' , { title : "Create Sign In / Sign Out | NCCU Attendance"});
};

exports.SignIn_create_post= [

    // Validate fields.
    body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.

        async.parallel({
        
            event: function(callback){
                Event.findById(req.params.eventid)
                .exec(callback)      

            }},

            function(err,results){
            if(err) {return next(err);}
    
            let _sign_in = results.event.Sign_in;
            let _userid = req.body.userid;
            console.log(_sign_in);
            if (_sign_in.indexOf(_userid) == -1){
                _sign_in.push(_userid);
                console.log('Successfully Create');
                }
            else {
                console.log("This User Id has already Sign In");
                res.redirect("../create/:eventid");

                return;
            }

            let new_event = {
                name : results.event.name,
                time : results.event.time,
                expense : results.event.expense,
                Sign_in : _sign_in
            }

            Event.findByIdAndUpdate(req.params.eventid, new_event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../attendancelist/:eventid");

            }
        )}
    )}       
];


exports.SignOut_create_post= [

    // Validate fields.
    body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.

        async.parallel({
        
            event: function(callback){
                Event.findById(req.params.eventid)
                .exec(callback)      

            }},

            function(err,results){
            if(err) {return next(err);}
    
            let _sign_out = results.event.Sign_out;
            let _userid = req.body.userid;
            console.log(_sign_out);
            if (_sign_out.indexOf(_userid) == -1){
                _sign_out.push(_userid);
                console.log('Successfully Create');
                }
            else {
                console.log("This User Id has already Sign Out");
                res.redirect("../create/:eventid");

                return;
            }

            let new_event = {
                name : results.event.name,
                time : results.event.time,
                expense : results.event.expense,
                Sign_out : _sign_out
            }

            Event.findByIdAndUpdate(req.params.eventid, new_event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../attendancelist/:eventid");
            
            }
        )}
    )}       
];

exports.SignBoth_create_post= [

    // Validate fields.
    body('userid', 'User Id must not be empty.').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    sanitizeBody('*').escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        

        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a Book object with escaped and trimmed data.

        async.parallel({
        
            event: function(callback){
                Event.findById(req.params.eventid)
                .exec(callback)      

            }},

            function(err,results){
            if(err) {return next(err);}
    
            let _sign_in = results.event.Sign_in;
            let _sign_out = results.event.Sign_out;
            let _userid = req.body.userid;

            console.log(_sign_in);
            if (_sign_in.indexOf(_userid) == -1){
                _sign_in.push(_userid);
                console.log('Successfully Create');
                }
            else {
                console.log("This User Id has already Sign In");
                res.redirect("./");

                return;
            }
            
            console.log(_sign_out);
            if (_sign_out.indexOf(_userid) == -1){
                _sign_out.push(_userid);
                console.log('Successfully Create');
                }
            else {
                console.log("This User Id has already Sign Out");
                res.redirect("./");

                return;
            }

            let new_event = {
                name : results.event.name,
                time : results.event.time,
                expense : results.event.expense,
                Sign_in : _sign_in,
                Sign_out : _sign_out
            }
            console.log(_sign_in);
            console.log(_sign_out);

            Event.findByIdAndUpdate(req.params.eventid, new_event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../attendancelist");
            
            }
        )}
    )}       
];


// Delete 不會分 signin 或 signout，而是直接delete有出席紀錄(in+out都有)的人，如果只有單一的in或out就不會算出席，就不需要delete(或是由管理員delete)
// 所以下面之後要改，概念是一樣的就把signin改成attendance就好

exports.SignIn_delete_post= [

    (req,res,next) =>{

        async.parallel({
        
            event: function(callback){
                Event.findById(req.params.eventid)
                .exec(callback)      

            }},

            function(err,results){
            if(err) {return next(err);}
    
            let _sign_in = results.event.Sign_in;
            let _userid = req.body.userid;
            console.log(_userid);
            console.log(_sign_in)

            for(let i = 0;i < _userid.length ; i++){
                console.log("i : "+i+"  userid : " + _userid[i]);
                _sign_in.splice(_sign_in.indexOf(_userid[i]),1);
            }
            console.log("new Sign In List: "+_sign_in);

            let new_event = {
                name : results.event.name,
                time : results.event.time,
                expense : results.event.expense,
                Sign_in : _sign_in
            }

            Event.findByIdAndUpdate(req.params.eventid, new_event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../attendancelist/:eventid");
            }
        )}
    )
    }];

exports.SignOut_delete_post= function(req,res){
    (req,res,next) =>{

        async.parallel({
        
            event: function(callback){
                Event.findById(req.params.eventid)
                .exec(callback)      

            }},

            function(err,results){
            if(err) {return next(err);}
    
            let _sign_out = results.event.Sign_out;
            let _userid = req.body.userid;
            console.log(_userid);
            console.log(_sign_out)

            for(let i = 0;i < _userid.length ; i++){
                console.log("i : "+i+"  userid : " + _userid[i]);
                _sign_out.splice(_sign_out.indexOf(_userid[i]),1);
            }
            console.log("new Sign In List: "+_sign_out);

            let new_event = {
                name : results.event.name,
                time : results.event.time,
                expense : results.event.expense,
                Sign_out : _sign_out
            }

            Event.findByIdAndUpdate(req.params.eventid, new_event, {}, function (err, theevent) {
                if (err) { return next(err); }
                // Successful - redirect to genre detail page.
                console.log('Successfully Update');
                res.redirect("../attendancelist/:eventid");
            }
        )}
    )
    }};



    
// exports.sponsor_delete_get= function(req,res,next){
//     async.parallel({
//         event: function (callback) {
//             Event.findById(req.params.eventid).exec(callback)
//         },
//     }, function (err, results) {
//         if (err) { return next(err); }
//         // No Need this function
//         if (results.event == null) { // No results.
//             console.log('Results.event is null');
//             // res.redirect('../');
//         }
//         console.log(results.event);
//         // Successful, so render.
//         // res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books });
//     });

//     res.render('index' , { title : "刪除活動"});
// };


// exports.sponsor_update_get= function(req,res,next){
//     // console.log(req.params.eventid);
//     Event.findById(req.params.eventid, function (err, event) {
//         if (err) { return next(err); }
//         if (event == null) { // No results.
//             let err = new Error('Event not found');
//             err.status = 404;
//             return next(err);
//         }
//         // Success.
//         console.log("GET");
//         // res.render('author_form', { title: 'Update Author', author: author });

//     });
// };

