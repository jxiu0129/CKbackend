const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const EventSchema = new Schema({
   // _id : Number,
   time : { type : Date, default : Date.now },
   name : { type: String, required : true},
   tag : String,
   location : String,
   info : String,
   link : String,
   contact_info : { tel : String, mail : String},
   amount : Number,       //參加人數
   Count_in: Number,      //簽到數
   Count_out: Number,     //簽退數
   expense : Number       //投資點數
   });

EventSchema.set('collection', 'Event'); // .set(配置選項,collection名稱) （若沒有此行配置，預設會透過下一行所設定的model名稱產生collection名稱）

// Export model.
module.exports = mongoose.model('Event', EventSchema);
