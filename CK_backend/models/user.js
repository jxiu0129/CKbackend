const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({    
    // _id : Number,
    student_id : Number,
    email : String,
    inited : { type: Boolean, default: false},
    name : { type: String, required : true},
    real_point : Number,
    hold : {
        isHolder : { type:Boolean, default: false },
        holded_events:[{ //要看完整event資訊，在query用populate叫
                type:Schema.Types.ObjectId,
                ref: 'Event',
                required : true
        }]
    },
    spendedAmount: Number, default : 0,
    attend: [{
        event_id: { 
            type: Schema.Types.ObjectId,
            ref : 'Event',
            required : true   
        },
        // income : {
        //     type: Number,
        //     // required : true  //暫時註解掉
        // },
        signin: Date,
        signout: Date
    }]
});

UserSchema.set('collection', 'User');
// Export model.
module.exports = mongoose.model('User', UserSchema);