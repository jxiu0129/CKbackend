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

// session test
router.get('/session', function(req, res, next) {
    if (req.session.views) {
      req.session.views++;
      res.setHeader('Content-Type', 'text/html');
      res.write('<p>views: ' + req.session.views + '</p>');
      res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>');
      req.session.name = req.query.id;
      res.write('<p>name: ' + req.session.name + '</p>');
      res.end();
    } else {
      req.session.views = 1;
      res.end('welcome to the session demo. refresh!');
    }
  });
  

// POST user login
router.get('/login_index',index_controller.login_index);

// POST sponsor login
// router.post('/sponsor_login',index_controller.sponsor_login_post);

module.exports = router;
