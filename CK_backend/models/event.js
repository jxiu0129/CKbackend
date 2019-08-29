const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const EventSchema = new Schema({
   // _id : Number,
   holder : { type: String, required : true},
   name : { type: String, required : true},
   time : { type : Date, required: true},
   location : String,
   expense : {type: Number, required : true },       //投資點數
   AttendanceList : [{ type: Schema.Types.ObjectId, ref: 'Attendance'}],  //有簽到and刷退 --> 出席名單
   Count_in: Number,      //簽到數
   Count_out: Number,     //簽退數
   amount : Number,       //參加人數
   });

EventSchema.set('collection', 'Event'); // .set(配置選項,collection名稱) （若沒有此行配置，預設會透過下一行所設定的model名稱產生collection名稱）

// Export model.
var model123 = mongoose.model('Event', EventSchema);
module.exports = model123;
