const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({    
//  _id : Number,
name : { type: String, required : true},
account : { type: String, required : true},
password : { type: String, required : true},
Attendance : { type: Schema.ObjectId, ref: 'attendance'}
});

UserSchema.set('collection', 'User');
// Export model.
module.exports = mongoose.model('User', UserSchema);
