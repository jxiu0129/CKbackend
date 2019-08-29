const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
   event_id: { type: String, required: true},
   list :
   [{
      student_id : { type : Number, required: true},
      time_in : { type : Date, default : Date.now },
      time_out : { type: Date, required: Date.now},
      reward : {type : Boolean, default: false}
   }]
});

AttendanceSchema.set('collection', 'Attendance');

// Export model.
module.exports = mongoose.model('Attendance', AttendanceSchema);
