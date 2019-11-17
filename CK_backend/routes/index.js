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
router.get('/eventslistBLI', index_controller.event_list_bli);

router.get('/QApage',index_controller.qapage_get);
router.get('/QApageBLI', index_controller.qapageBLI_get);

router.get('/user_profile', index_controller.profile_user);

router.get('/edit_info_first', index_controller.edit_info_first_get);

router.post('/edit_info_first', index_controller.edit_info_first_post);

router.get('/user_profile/edit_info', index_controller.edit_info_get);

router.post('/user_profile/edit_info', index_controller.edit_info_post);

router.get('/logout', index_controller.logout_but);

// router.get('/updateUserInfo',(req, res, redirectUri) => {
//   index_controller.getUserInfoOutSide(req, req.session.API_Access.access_token, redirectUri);
//   res.render('qrcode/alertmessage',{username: req.session.user_info.user_info.name,title:'活動順利結束',msg:'出席名單已成功發送給【政大錢包】'});
// });

module.exports = router;
