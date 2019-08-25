const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({    
//  _id : Number,
name : { type: String, required : true},
contact_info: { 
    email: String, 
    tel: String
},
holder : {
    isHolder : { 
        type:Boolean,
        default: false
    },
    holded_event:[{
        event_ids:
        {
            type:Schema.Types.ObjectId,
            ref: 'Event',
            required : true
        },
        expense :
        {
            type: Schema.Types.Number,
            ref : 'Event',
            required : true
        },
        atnd_amount:
        {
            type: Schema.Types.Number,
            ref : 'Event',
            required : true
        }
    }]
},
attend: [{
    event_id: { 
        type: Schema.Types.ObjectId,
        ref : 'Event',
        required : true
    },
    income : {
        type: Number,
        required : true
    },
    signin: Date,
    signiout: Date
}]


/*
name : { type: String, required : true},
account : { type: String, required : true},
password : { type: String, required : true},
Attendance : { type: Schema.ObjectId, ref: 'attendance'}
*/
});

UserSchema.set('collection', 'User');
// Export model.
module.exports = mongoose.model('User', UserSchema);
