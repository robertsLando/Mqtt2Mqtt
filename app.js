var express = require('express'),
reqlib = require('app-root-path').require,
logger = require('morgan'),
cookieParser = require('cookie-parser'),
bodyParser = require('body-parser'),
app = express(),
jsonStore = reqlib('/lib/jsonStore.js'),
store = reqlib('config/store.js'),
cors = require('cors'),
config = reqlib('config/app.js'),
debug = reqlib('/lib/debug')('App'),
broker = reqlib('lib/broker'),
history = require('connect-history-api-fallback'),
utils = reqlib('/lib/utils.js');

debug("Application path:" + utils.getPath(true));

// view engine setup
app.set('views', utils.joinPath(utils.getPath(), 'views'));
app.set('view engine', 'ejs');

app.use(history());

app.use(logger('dev'));
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.use(cookieParser());

app.use('/', express.static(utils.joinPath(utils.getPath(), 'dist')));

app.use(cors());

// ----- APIs ------

// get settings
app.get('/api/settings', function(req, res) {
  res.json({success:true, settings: jsonStore.get(store.settings)});
})

// update settings
app.post('/api/settings', function(req, res) {
  jsonStore.put(store.settings, req.body)
  .then(data => {
    broker.restart();
    res.json({success: true, message: "Configuration updated successfully"})
  })
  .catch(err => {
    debug(err)
    res.json({success: false, message: err.message})
  })
})

// get settings
app.get('/api/status', function(req, res) {
  res.json({success:true, status: broker.status()});
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.log("%s %s %d - Error: %s", req.method, req.url, err.status, err.message);

  // render the error page
  res.status(err.status || 500);
  res.redirect('/');
});

// PROCESS MANAGEMENT

process.on('SIGINT', function() {
  debug('Closing...');
  process.exit();
});

broker.init();

//setTimeout(broker.init, 5000)

module.exports = app;
