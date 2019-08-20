const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
   // _id : Number,
   time : { type : Date, default : Date.now },
   name : { type: String, /*required: true*/},
   location : String,
   sign_in : { type: Boolean, required: true},
   sign_out : { type: Boolean, required: true},
   income : Number
   });


// Export model.
module.exports = mongoose.model('Attendance', AttendanceSchema);
