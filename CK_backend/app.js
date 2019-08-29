const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session'); 
const MongoStore = require('connect-mongo')(session);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const sponsorRouter = require('./routes/sponsor');
const adminRouter = require('./routes/admin');

// 设置 Mongoose 连接
const mongoose = require('mongoose');
const mongoDB = 'mongodb+srv://ckbackend:ckbackend@cluster0-sfo3z.mongodb.net/Jackk?retryWrites=true&w=majority';
mongoose.connect(mongoDB,{ useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB 连接错误：'));

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); //for read the form
app.use(cookieParser());

// session
app.use(session({
  secret: 'ckEventPromoter',
  resave: false,  //強制保存session即使它並沒有變化
  saveUninitialized: false, //強制將未初始化的session存儲。當新建了一個session且未設定屬性或值時，它就處於未初始化狀態。在設定一個cookie前，這對於登陸驗證，減輕服務端存儲壓力，權限控制是有幫助的。
  cookie: {
    maxAge: 12 * 3600 * 1000 // 保存半天
  },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
  })
}));


app.use(express.static(path.join(__dirname, 'public')));

app.use(indexRouter);
app.use(usersRouter);
app.use(sponsorRouter);
app.use(adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
