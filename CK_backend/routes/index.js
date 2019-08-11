const express = require('express');
const router = express.Router();

// Require Controllers
const index_controller = require('../controllers/indexController');

// ROUTES:

// GET sponsors events and show detail of events
// router.get('/sponsor/events',sponsor_controller.sponsor_events);
// Home_Routes 
// GET home page
router.get('/', index_controller.index);

// POST user login
router.post('/user_login',index_controller.user_login_post);

// POST sponsor login
router.post('/sponsor_login',index_controller.sponsor_login_post);

module.exports = router;
