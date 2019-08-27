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
            type:Schema.Types.ObjectId,
            ref: 'Event',
            required : true
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
});

UserSchema.set('collection', 'User');
// Export model.
module.exports = mongoose.model('User', UserSchema);