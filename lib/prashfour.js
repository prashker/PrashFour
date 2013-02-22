var express = require('express');
var http = require('http');
var path = require('path');
var config = require('../config');

var irc = require('irc');
var socketio = require('socket.io');
var sockethandler = require('./sockethandler');

var app = exports.app = express();
var server = exports.server = http.createServer(app);

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ' + err);
});

var PrashFour = exports.PrashFour = function() {
    this.app = app;
    this.server = server;
}

PrashFour.prototype.start = function () {
    var connections = {};
    
    // link up socket.io with our express app
    socketio = socketio.listen(server);

    socketio.sockets.on('connection', function(socket) {
        //start handling the socket
        sockethandler(socket, connections);
    });

    if (this.server.address()) console.log('PrashFour started on port %s', this.server.address().port);
}

app.configure(function(){
    var basePath = path.join(__dirname, '..');
    app.use(require('connect-assets')({build: false, src: basePath + '/public'})); //all assets are in the public
    
    app.set('port', process.env.PORT || config.config.port);
    app.set('client_port', process.env.CLIENT_PORT || config.config.client_port);
    app.set('views', basePath + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.static(basePath + '/public'));
    app.locals.pretty = true; //nice html for output
});

app.get('/', function(req, res){
    res.render('index.jade', {port: app.set('client_port')});
});

server.listen(app.get('port'));