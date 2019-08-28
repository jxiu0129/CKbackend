const express = require('express');
const router = express.Router();

const user_controller = require('../controllers/userController');

// User_Routes: This is for users to manage their check in and check out , and their participation

// GET user manage page
router.get('/user',user_controller.user);

// GET record of check in and check out 
router.get('/user/record',user_controller.user_record);

// GET users participated events and points from each events
router.get('/user/events',user_controller.user_events);

// for posting testing data (postman)
const Attendance = require('../models/attendance');
router.get('/user/test', (req,res) => {
    let attend = new Attendance();
    attend.name = req.query.name;
    attend.sign_in = true;
    attend.sign_out = true;

    attend.save((err) => {
        if(err) throw err;
        res.send('success post');
    });
});

const User = require('../models/user');
router.post('/user/create_dick_account', (req, res) => {
    let new_user = new User();
    new_user.name = "dick";
    new_user.contact_info = { email: "dafddasds@dadfasdf", tel: "092342341341"};
    
    new_user.save((err) => {
        if(err) throw err;
        res.send('dick');
    });
});

const Event = require("../models/event");
router.post('/user/create_dick_event', (req, res) => {
    let new_event = new Event({
        holder : 'dick',
        name : 'hello1',
        time : Date.now(),
        expense : 314159,
        location : 'toilet',
    });

    new_event.save((err) => {
        if(err) throw err;
        res.send('dick');
    });
});

router.get('/user/find_event_id', (req, res) => {
    Event.find({} ,'AttendanceList');
});

router.post('/user/create_dick_event_2', (req, res) => {
    let new_event = new Event({
        holder : 'dick',
        name : 'hello1',
        time : Date.now(),
        expense : 314159,
        location : 'toilet',
    });

    new_event.save((err) => {
        if(err) throw err;
        res.send('dick');
    });
})

router.post('/user/create_dick_attend', (req, res) => {
    let new_attend_list = new Attendance({
        event_id : 'adfadsf',
        list : {
            student_id: 12312312, 
            time_in : Date.now(),
            time_out : Date.now(),
            reward : true
        }
    });
    new_attend_list.save((err) => {
        if(err) throw err;
        res.send('dick');
    });
});

/*router.post('/user/create_dick_event', (req, res) => {
    let 
})*/

module.exports = router;
