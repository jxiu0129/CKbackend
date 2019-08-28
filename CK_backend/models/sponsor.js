const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const sponsorSchema = new Schema({    
    // _id : Number,

    name : { type : String, required : true},
    Enroll_date: { type : Date, default : Date.now},
    account_balance : Number,
    events : { type: Schema.ObjectId, ref: 'Event'}, 

 /*   
    name : { type : String, required : true},
    Eroll_date: { type : Date, default : Date.now},
    
    // signin_rate : Number,       //（過去活動簽到率）
    // signout_rate: Number,       //（過去活動簽退率）
    
    //折線圖：參加人數與投資金額的摺線圖
    //bar chart:每場活動 投資金額與參加人數的比例

    account_balance : Number,
    events : { type: Schema.ObjectId, ref: 'Event'}, */
});


// Export model.
module.exports = mongoose.model('sponsor', sponsorSchema);
