const express = require('express');
const router = express.Router();

const sponsor_controller = require('../controllers/sponsorController');

// GET sponsors events and show detail of events
router.get('/sponsor/events/',sponsor_controller.sponsor_events);

// GET request for creating a event and input investments.
router.get('/sponsor/events/createevent', sponsor_controller.sponsor_create_get);

// POST request for creating events.
router.post('/sponsor/events/createevent', sponsor_controller.sponsor_create_post);


// POST request to delete events.
router.post('/sponsor/events/:eventid/delete', sponsor_controller.sponsor_delete_post);

// POST request to update events.
router.post('/sponsor/manage/:eventid/update', sponsor_controller.sponsor_update_post);

// GET request for attendance list
router.get('/sponsor/events/:eventid/attendancelist', sponsor_controller.events_attendancelist);

// GET request for creating a check in or check out of users.
router.get('/sponsor/events/:eventid/create', sponsor_controller.check_create_get);

// POST request for creating a check in or check out of users.
router.post('/sponsor/events/:eventid/create/Signin', sponsor_controller.SignIn_create_post);
router.post('/sponsor/events/:eventid/create/Signout', sponsor_controller.SignOut_create_post);
router.post('/sponsor/events/:eventid/create/Signboth', sponsor_controller.SignBoth_create_post);

// POST request to delete users.
router.post('/sponsor/events/:eventid/deleteuser', sponsor_controller.SignIn_delete_post);

// POST request to delete checks.
// router.post('/sponsor/events/SignInDelete/:eventid', sponsor_controller.SignIn_delete_post);
// router.post('/sponsor/events/SignOutDelete/:eventid', sponsor_controller.SignOut_delete_post);

// GET request to delete events.
// router.get('/sponsor/manage/delete/:eventid', sponsor_controller.sponsor_delete_get);

// GET request to update events.
// router.get('/sponsor/manage/update/:eventid', sponsor_controller.sponsor_update_get);


module.exports = router;