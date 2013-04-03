//MongoDB Models
require('./mongooseschema.js')();

var express = require('express');
var http = require('http');
var path = require('path');
var config = require('../config').config;

var irc = require('irc');
var socketio = require('socket.io');
var sockethandler = require('./sockethandler');
var mongoose = require('mongoose');

var app = exports.app = express();
var server = exports.server = http.createServer(app);

process.on('uncaughtException', function(err) {
    //Primarily implemented because if the database connection fails, without catching this, the app crashes
    console.log('Caught exception: ' + err);
});

var PrashFour = exports.PrashFour = function() {
    this.app = app;
    this.server = server;
}

PrashFour.prototype.start = function () {
    var allConnections = {}; //array of all active connections of every single user
    
    //Connect to the database
    mongoose.connect(this.app.get('mongoose_auth'));

    // link up socket.io with our express app
    socketio = socketio.listen(server);

    socketio.sockets.on('connection', function(socket) {
        //start handling the socket
        sockethandler(socket, allConnections);
    });

    //http://nodejs.org/api/net.html#net_server_address
    if (this.server.address()) console.log('PrashFour started at port %s', this.server.address().port);
}

app.configure(function(){
    var basePath = path.join(__dirname, '..');
    
    //https://github.com/adunkman/connect-assets
    app.use(require('connect-assets')({build: false, src: basePath + '/public'})); //all assets are in the public (by default it wants /assets, but that goes against the default express structure)
    
    app.set('port', process.env.PORT || config.port); //http 
    app.set('client_port', process.env.CLIENT_PORT || config.port); //socket.io
    
    app.set('views', basePath + '/views');
    app.set('view engine', 'jade');
    
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    
    app.use(express.static(basePath + '/public'));
    app.locals.pretty = true; //nice html for output (new for express 3.0)
    
    app.set('mongoose_auth', config.mongoose_auth);
});

app.get('/', function(req, res){
    res.render('index.jade', {port: app.get('port')});
});

server.listen(app.get('port'));