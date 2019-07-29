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

module.exports = router;
