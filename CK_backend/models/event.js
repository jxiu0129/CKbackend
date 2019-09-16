const mongoose = require('mongoose');
const shortid = require('shortid');

const Schema = mongoose.Schema;

const EventSchema = new Schema({
   // _id : Schema.Types.ObjectId,
   shortid : { type : String, default : shortid.generate},
   holder : { type: String, /*required : true*/},  //註解For test
   name : { type: String, required : true},
   time : { type : Date, required: true},
   location : String,
   expense : {type: Number, required : true },       //投資點數
   AttendanceList : [{ type: Schema.Types.ObjectId, ref: 'Attendance'}],  //有簽到and刷退 --> 出席名單
   Count_in: Number,      //簽到數
   Count_out: Number,     //簽退數
   amount : Number,       //參加人數
   //活動狀態依序分為：尚未開始，正在進行，活動結束(名單送出)
   status : {type: String, required : true , enum :['willhold','holding','finish'], default: 'willhold'},
   });

EventSchema.set('collection', 'Event'); // .set(配置選項,collection名稱) （若沒有此行配置，預設會透過下一行所設定的model名稱產生collection名稱）

// Export model.
var model123 = mongoose.model('Event', EventSchema);
module.exports = model123;
