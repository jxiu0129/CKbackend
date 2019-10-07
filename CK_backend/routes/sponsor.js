const express = require('express');
const router = express.Router();

const index_controller = require('../controllers/indexController');
const sponsor_controller = require('../controllers/sponsorController');

// GET sponsors events and show detail of events
router.get('/sponsor/events/',sponsor_controller.sponsor_events);

// GET request for creating a event and input investments.
router.get('/sponsor/events/createevent', sponsor_controller.sponsor_create_get);

// POST request for creating events.
router.post('/sponsor/events/createevent', sponsor_controller.sponsor_create_post);

// POST request to delete events.
router.post('/sponsor/events/:eventid/delete', sponsor_controller.sponsor_delete_post_test);

// POST request to update events.
router.post('/sponsor/events/:eventid/update', sponsor_controller.sponsor_update_post);

// GET request for attendance list
router.get('/sponsor/events/:eventid/attendancelist', sponsor_controller.events_attendancelist);
router.get('/sponsor/events/:eventid/attendancelist_test', sponsor_controller.events_attendancelist_record);

// GET request for creating a check in or check out of users.
router.get('/sponsor/events/:eventid/SigninCreate', sponsor_controller.SignIn_create_get);
router.get('/sponsor/events/:eventid/SignoutCreate', sponsor_controller.SignOut_create_get);
router.get('/sponsor/events/:eventid/SignbothCreate', sponsor_controller.SignBoth_create_get);

// POST request for creating a check in or check out of users.
router.post('/sponsor/events/:eventid/SigninCreate', sponsor_controller.SignIn_create_post);
router.post('/sponsor/events/:eventid/SignoutCreate', sponsor_controller.SignOut_create_post);
router.post('/sponsor/events/:eventid/SignbothCreate', sponsor_controller.SignBoth_create_post);


router.get('/sponsor/events/:eventid/SendMultiPoint', index_controller.Send_Multi_Point);

module.exports = router;