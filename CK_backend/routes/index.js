const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');


// Require Controllers
const home_controller = require('../controllers/homeController');
// const user_controller = require('../controllers/user.js');
// const sponser_controller = require('../controllers/sponser.js');
// const admin_controller = require('../controllers/admin.js');

// ROUTES:

// Home_Routes 
// GET home page
router.get('/', home_controller.index);

// POST user login
router.post('/user_login',home_controller.user_login_post);

// POST sponser login
router.post('/sponser_login',home_controller.sponser_login_post);

module.exports = router;
