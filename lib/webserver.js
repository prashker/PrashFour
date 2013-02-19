var express = require('express'),
	http = require('http'),
	path = require('path');

var app = exports.app = express();
var server = exports.server = http.createServer(app);


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
  app.locals.pretty = true;
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', function(req, res){
  res.render('index.jade');
});

server.listen(app.get('port'));