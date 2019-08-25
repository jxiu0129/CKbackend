const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const EventSchema = new Schema({
   //  _id : _id,
   holder : { type: String, required : true},
   name : { type: String, required : true},
   time : { type : Date, required: true},
   location : String,
   expense : {type: Number, required : true },       //投資點數
   /*Sign_in: [{ type: Schema.ObjectId, ref: 'user'}],       //簽到名單
   Sign_out: [{ type: Schema.ObjectId, ref: 'user'}],*/      //簽退名單
   AttendanceList : [{ type: Schema.Types.ObjectId, ref: 'Attendance'}],  //有簽到and刷退 --> 出席名單
   Count_in: Number,      //簽到數
   Count_out: Number,     //簽退數
   amount : Number,       //參加人數

/*   name : { type: String, required : true},
   time : { type : Date, required: true},
   expense : {type: Number, required : true },       //投資點數
   location : String,
   // contact_info : { tel : String, mail : String},
   Sign_in: [{ type: Schema.ObjectId, ref: 'user'}],       //簽到名單
   Sign_out: [{ type: Schema.ObjectId, ref: 'user'}],      //簽退名單
   AttendanceList : [{ type: Schema.ObjectId, ref: 'user'}],  //有簽到and刷退 --> 出席名單
   Count_in: Number,      //簽到數
   Count_out: Number,     //簽退數
   amount : Number,       //參加人數

   sponsor: { type: Schema.ObjectId, ref: 'sponsor'},  */
   });

EventSchema.set('collection', 'Event'); // .set(配置選項,collection名稱) （若沒有此行配置，預設會透過下一行所設定的model名稱產生collection名稱）

// Export model.
module.exports = mongoose.model('Event', EventSchema);
