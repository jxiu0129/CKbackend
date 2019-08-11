const express = require('express');
const router = express.Router();

const sponsor_controller = require('../controllers/sponsorController');

//// sponsor_Routes: This is for sponsor to manage their events.
 /*// GET sponsor manage page
 router.get('/sponsor',sponsor_controller.sponsor); */
 
// GET sponsors events and show detail of events
router.get('/sponsor/events',sponsor_controller.sponsor_events);

// GET request for creating a event and input investments.
router.get('/sponsor/manage', sponsor_controller.sponsor_create_get);

// POST request for creating events.
router.post('/sponsor/manage', sponsor_controller.sponsor_create_post);

// GET request to delete events.
router.get('/sponsor/manage/delete', sponsor_controller.sponsor_delete_get);

// POST request to delete events.
router.post('/sponsor/manage/delete', sponsor_controller.sponsor_delete_post);

// GET request to update events.
router.get('/sponsor/manage/update', sponsor_controller.sponsor_update_get);

// POST request to update events.
router.post('/sponsor/manage/update', sponsor_controller.sponsor_update_post);

// GET request for attendance list
router.get('/sponsor/events/attendancelist', sponsor_controller.events_attendancelist);

// GET request for creating a check in or check out of users.
router.get('/sponsor/events/create', sponsor_controller.check_create_get);

// POST request for creating a check in or check out of users.
router.post('/sponsor/events/create', sponsor_controller.check_create_post);

// GET request to delete checks.
router.get('/sponsor/events/delete', sponsor_controller.check_delete_get);

// POST request to delete checks.
router.post('/sponsor/events/delete', sponsor_controller.check_delete_post);

// GET request to update checks.
router.get('/sponsor/events/update', sponsor_controller.check_update_get);

// POST request to update checks.
router.post('/sponsor/events/update', sponsor_controller.check_update_post);

module.exports = router;