var express = require('express');
var router = express.Router();

const qrcontroller = require('../controllers/qrController');
// const QRCode = require('qrcode');
// const async = require("async");

// const rp = require('request-promise');
// const Attendance = require("../models/attendance");
// const Event = require("../models/event");
// const User = require("../models/user");

// const sponsor_controller = require('../controllers/sponsorController');

//QRCODE

/* GET QR page. */

// 掃描qrcode 並 簽到

router.get('/testSignIn/:eventid',qrcontroller.QRsignin);

// 掃描qrcode 並 刷退
router.get('/testSignOut/:eventid',qrcontroller.QRsignout);

//登入的跳轉
router.get('/QRin_login/:eventid',qrcontroller.login_checkin);
router.get('/QRout_login/:eventid',qrcontroller.login_checkout);

router.get('/QRin_nologin/:eventid',(req,res)=>{
    res.render('qrcode/checkin_nolog',{eventid:req.params.eventid});
});

router.get('/QRout_nologin/:eventid',(req,res)=>{
    res.render('qrcode/checkout_nolog',{eventid:req.params.eventid});
});

router.get('/qrcodelist',qrcontroller.qrcodelist);




// 底下為local端測試

const fs = require('fs');
const moment = require('moment');
const json2csv = require('json2csv').parse;
const path = require('path');
// const fields = ['name','email','time_in','time_out'];

router.get('/ttest',(req,res)=>{
    Attendance.findOne({event_id:'5d9d8f2e53de890b5cf82510'}, function (err, attd) {
        console.log(attd);
        let email_in_atd = attd.list.map(x=>x.email);
        User.find({email:email_in_atd},function(err,user){
            console.log(user);
        });
    });
});

router.get('/tttest',async (req,res)=>{

    Attendance.findOne({event_id:'5dbff4b7d1352a36488c805d'}, function (err, attd) {
        if (err) {
          return res.status(500).json({ err });
        }

        else {
            let email_in_atd = attd.list.map(x=>x.email);
                let user;
                list = attd.list;
                for (let i =0; i <list.length ; i++){
                    User.findOne({email:list[i].email},(err,_user)=>{
                        user = _user;
                    });
                    console.log(user);
                    list[i] = {
                        email : list[i].email,
                        time_in : list[i].time_in,
                        time_out : list[i].time_out,
                        name : user[i].name
                    };
                }
                console.log(list);
                try {
                  csv = json2csv(list, {fields,withBOM:true});
                } catch (err) {
                  return res.status(500).json({ err });
                }
                const dateTime = moment().format('YYYYMMDDhhmmss');
                const filePath = path.join(__dirname, "..", "public", "csv-" + dateTime + ".csv")
                fs.writeFile(filePath, csv, function (err) {
                  if (err) {
                    return res.json(err).status(500);
                  }
                  else {
                    setTimeout(function () {
                      fs.unlinkSync(filePath); // delete this file after 30 seconds
                    }, 300000);
                    return res.json("/csv-" + dateTime + ".csv");
                  }
                });      
        }
      });
    });

const fields = ['email', 'time_in','time_out'];
    
router.get('/exportCSV/:eventid', function (req, res) {
    Attendance.findOne({event_id:req.params.eventid}, async (err, attd) => {
    if (err) {
        return res.status(500).json({ err });
    }
    else {
        let csv;
        let list = attd.list;
        try {
        csv = json2csv(list, { fields });
        } 
        catch (err) {
        return res.status(500).json({ err });
        }
        const dateTime = moment().format('YYYYMMDDhhmmss');
        const filePath = path.join(__dirname, "..", "public", "csv-" + dateTime + ".csv");

        await fs.writeFile(filePath, csv, (err) => {
        if (err) {
            return res.json(err).status(500);
        }
        else {
            setTimeout(() => {
                fs.unlinkSync(filePath); // delete this file after 30 seconds
            }, 30000);
            // res.json("/exports/csv-" + dateTime + ".csv");
            res.download(filePath, () => {console.log('success download');});
        }
        });

    }
    });
});


router.get('/userinfo',(req,res)=>{
    req.session.reload();
    res.send(req.session.user_info);
    console.log('ui: '+req.session.user_info);
});

module.exports = router;