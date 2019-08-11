const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sponsorSchema = new Schema({    
    // _id : Number,
    name : { type : String, required : true},
    Eroll_date: { type : Date, default : Date.now},
    signin_rate : Number,       //（過去活動簽到率）
    signout_rate: Number,       //（過去活動簽退率）
    account_balance : Number,
    events : { type: Schema.ObjectId, ref: 'Event'}, 
});


// Export model.
module.exports = mongoose.model('sponsor', sponsorSchema);
