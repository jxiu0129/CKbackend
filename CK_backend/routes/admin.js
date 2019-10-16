const express = require('express');
const router = express.Router();

const admin_controller = require('../controllers/adminController');

// Admin_Routes: This is for admin to manage and monitor the entire system.
// GET admin page
router.get('/admin', admin_controller.admin);

router.get('/admin/events', admin_controller.event_list);

router.get('/admin/events/createevent_first',admin_controller.create_event_first_get);

router.post('/admin/events/createevent_first',admin_controller.create_event_first_post);

router.get('/admin/events/createevent_second/:userid',admin_controller.create_event_second_get);

router.post('/admin/events/createevent_second/:userid',admin_controller.create_event_second_post);

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

// GET sponsor information
router.get('/admin/sponsor',admin_controller.sponsor_events);

// GET events information
router.get('/admin/events',admin_controller.all_events);

module.exports = router;