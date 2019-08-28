const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
   // _id : Number,
   event_id: { type: String, required: true},
   list :
   [{
      student_id : { type : Number, required: true},
      time_in : { type : Date, /*default : Date.now */},
      time_out : { type: Date, /*default : Date.now */},
      reward : {type : Boolean, default: false}
   }]


   /*   time : { type : Date, default : Date.now },
   name : { type: String, required: true},
   location : String,
   sign_in : { type: Boolean, required: true},
   sign_out : { type: Boolean, required: true},
   income : Number*/
   });

AttendanceSchema.set('collection', 'Attendance');

// Export model.
module.exports = mongoose.model('Attendance', AttendanceSchema);
