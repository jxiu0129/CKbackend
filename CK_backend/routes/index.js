const express = require('express');
const router = express.Router();
const app = express();
const path = require('path');


// Require Controllers
const home_controller = require('../controllers/home.js');
const user_controller = require('../controllers/user.js');
const sponser_controller = require('../controllers/sponser.js');
const admin_controller = require('../controllers/admin.js');

// ROUTES:

// Home_Routes 
// GET home page
router.get('/', home_controller.index);

// POST user login
router.post('/user_login',home_controller.user_login_post);

// POST sponser login
router.post('/sponser_login',home_controller.sponser_login_post);


// User_Routes: This is for users to manage their check in and check out , and their participation
// GET user manage page
router.get('/user',user_controller.user);

// GET record of check in and check out 
router.get('/user/record',user_controller.user_record);

// GET users participated events and points from each events
router.get('/user/events',user_controller.user_events);

// Sponser_Routes: This is for sponser to manage their events.
// GET sponser manage page
router.get('/sponser',sponser_controller.sponser);

// GET request for creating a event and input investments.
router.get('/sponser/manage', sponser_controller.sponser_create_get);

// POST request for creating events.
router.post('/sponser/manage', sponser_controller.sponser_create_post);

// GET request to delete events.
router.get('/sponser/manage/delete', sponser_controller.sponser_delete_get);

// POST request to delete events.
router.post('/sponser/manage/delete', sponser_controller.sponser_delete_post);

// GET request to update events.
router.get('/sponser/manage/update', sponser_controller.sponser_update_get);

// POST request to update events.
router.post('/sponser/manage/update', sponser_controller.sponser_update_post);

// GET sponsers events and show detail of events
router.get('/sponser/events',sponser_controller.sponser_events);

// GET request for creating a check in or check out of users.
router.get('/sponser/events/create', sponser_controller.check_create_get);

// POST request for creating a check in or check out of users.
router.post('/sponser/events/create', sponser_controller.check_create_post);

// GET request to delete checks.
router.get('/sponser/events/delete', sponser_controller.check_delete_get);

// POST request to delete checks.
router.post('/sponser/events/delete', sponser_controller.check_delete_post);

// GET request to update checks.
router.get('/sponser/events/update', sponser_controller.check_update_get);

// POST request to update checks.
router.post('/sponser/events/update', sponser_controller.check_update_post);

// Admin_Routes: This is for admin to manage and monitor the entire system.
// GET admin page
router.get('/admin', admin_controller.admin);

// GET request for creating a check in or check out of users.
router.get('/admin/checks/create', admin_controller.check_create_get);

// POST request for creating a check in or check out of users.
router.post('/admin/checks/create', admin_controller.check_create_post);

// GET request to delete checks.
router.get('/admin/checks/delete', admin_controller.check_delete_get);

// POST request to delete checks.
router.post('/admin/checks/delete', admin_controller.check_delete_post);

// GET request to update checks.
router.get('/admin/checks/update', admin_controller.check_update_get);

// POST request to update checks.
router.post('/admin/checks/update', admin_controller.check_update_post);

// GET user information
router.get('/admin/user',admin_controller.user_events);

// GET sponser information
router.get('/admin/sponser',admin_controller.sponser_events);

// GET events information
router.get('/admin/events',admin_controller.all_events);


module.exports = router;
