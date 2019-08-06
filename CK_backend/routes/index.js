const express = require('express');
const router = express.Router();

// Require Controllers
const home_controller = require('../controllers/homeController');
// const user_controller = require('../controllers/userController');
// const sponser_controller = require('../controllers/sponserController');
// const admin_controller = require('../controllers/adminController');

// ROUTES:

// GET sponsers events and show detail of events
// router.get('/sponser/events',sponser_controller.sponser_events);
// Home_Routes 
// GET home page
router.get('/', home_controller.index);

// POST user login
router.post('/user_login',home_controller.user_login_post);

// POST sponser login
router.post('/sponser_login',home_controller.sponser_login_post);

module.exports = router;
