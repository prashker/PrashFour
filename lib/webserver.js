var express = require('express'),
	http = require('http'),
	path = require('path');

var app = exports.app = express();

app.configure(function(){
  var basePath = path.join(__dirname, '..');
  app.set('port', process.env.PORT || 3000);
  app.set('views', basePath + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(basePath + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index.jade');
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});