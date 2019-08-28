const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({    
//  _id : Number,
    name : { type: String, required : true},
    contact_info: { 
        email: String, 
        tel: String
    },
    hold : {
        isHolder : { type:Boolean, default: false },
        holded_events:[{ //要看完整event資訊，在query用populate叫
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