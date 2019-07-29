const express = require('express');
const router = express.router();

const sponser_controller = require('../controllers/sponserController');


//// Sponser_Routes: This is for sponser to manage their events.
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

module.exports = router;