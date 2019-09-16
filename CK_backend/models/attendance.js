const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AttendanceSchema = new Schema({
   event_id: { type: String, required: true},
   list :
   [{
      student_id : { type : Number, /*required: true*/},
      email : {type : String, required: true},
      time_in : { type : Date, /*default : Date.now*/ },  // 註解for test 
      time_out : { type: Date, /*default: Date.now*/  },  // 註解for test (required:date.now?)
      reward : {type : Boolean, default: false}
   }]
});

AttendanceSchema.set('collection', 'Attendance');

// Export model.
module.exports = mongoose.model('Attendance', AttendanceSchema);
