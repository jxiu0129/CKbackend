const express = require('express');
const router = express.Router();

const admin_controller = require('../controllers/adminController');

// Admin_Routes: This is for admin to manage and monitor the entire system.
// GET admin page
router.get('/admin', admin_controller.admin);

router.get('/admin/events', admin_controller.event_list);

router.get('/admin/events/eventinfo/:eventid', admin_controller.event_info);

router.get('/admin/events/createevent_first',admin_controller.create_event_first_get);

router.post('/admin/events/createevent_first',admin_controller.create_event_first_post);

router.get('/admin/events/createevent_second/:userid',admin_controller.create_event_second_get);

router.post('/admin/events/createevent_second/:userid',admin_controller.create_event_second_post);

router.post('/admin/events/delete',admin_controller.event_delete_post);

router.post('/admin/events/update',admin_controller.event_update_post);

router.get('/admin/events/:eventid/attendancelist', admin_controller.event_attendancelist);

router.get('/admin/events/:eventid/SigninCreate', admin_controller.Signin_create_get);
router.get('/admin/events/:eventid/SignoutCreate', admin_controller.Signout_create_get);
router.get('/admin/events/:eventid/SignbothCreate', admin_controller.Signboth_create_get);

// POST request for creating a check in or check out of users.
router.post('/admin/events/:eventid/SigninCreate', admin_controller.Signin_create_post);
router.post('/admin/events/:eventid/SignoutCreate', admin_controller.Signout_create_post);
router.post('/admin/events/:eventid/SignbothCreate', admin_controller.Signboth_create_post);

// // GET request to delete checks.
// router.get('/admin/checks/delete', admin_controller.check_delete_get);

// // POST request to delete checks.
// router.get('/admin/:eventid', admin_controller.check_delete_post);


// GET user list
router.get('/admin/user/userlist',admin_controller.user_list);

// GET user list
router.get('/admin/user/:userid',admin_controller.user_info);

router.get('/admin/user/:userid/events',admin_controller.user_holded);

router.get('/admin/user/:userid/record',admin_controller.user_record);

// // GET user create
router.get('/admin/user/createUser',admin_controller.user_create_get);
router.post('/admin/user/createUser',admin_controller.user_create_post);

// // GET sponsor information
// router.get('/admin/sponsor',admin_controller.sponsor_events);

// // GET events information
// router.get('/admin/events',admin_controller.all_events);

module.exports = router;