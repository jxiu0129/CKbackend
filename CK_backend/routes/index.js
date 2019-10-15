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

// nodemailer test
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
  host: "nccu.edu.tw",
  port: "25",
  secure: false
});


router.get('/sendMail', (req,res) => {
  transporter.sendMail({
    from: '"test" <105306035@nccu.edu.tw>',
    to: 'h.s.i.e.h.tw.29@gmail.com',
    subject: 'test nodemailer',
  }, (err, info) => {
    res.send(err);
  });
});


// POST user login
router.get('/login_index',index_controller.login_index);

// POST sponsor login
// router.post('/sponsor_login',index_controller.sponsor_login_post);


// GET event list
router.get('/eventslist',index_controller.event_list);

router.get('/user_profile', index_controller.profile_user);

router.get('/edit_info_first', index_controller.edit_info_first_get);

router.post('/edit_info_first', index_controller.edit_info_first_post);

router.get('/user_profile/edit_info', index_controller.edit_info_get);

router.post('/user_profile/edit_info', index_controller.edit_info_post);


module.exports = router;
