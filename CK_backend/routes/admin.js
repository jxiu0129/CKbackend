const express = require('express');
const router = express.router();

const admin_controller = require('../controllers/adminController');

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