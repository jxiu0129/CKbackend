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
router.get('/layout', (req, res) => {
  res.render('root/layout');
});

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


// GET event list
router.get('/eventslist',function(req,res,next){
  res.render('root/eventlist' , { title : "Event List | NCCU Attendance"});
});

// GET coupon list
router.get('/couponlist',function(req,res,next){
  res.render('root/couponlist' , { title : "Event List | NCCU Attendance"});
});

router.get('/user_profile', index_controller.profile_user);

module.exports = router;
