var irc = require('irc');
var socketio = require('socket.io');
var app = require('./webserver').app;
var server = require('./webserver').server;
var sockethandler = require('./sockethandler');


var PrashFour = exports.PrashFour = function() {
    this.app = app;
    this.server = server;
}

PrashFour.prototype.start = function () {
    var connections = {};

    // link up socket.io with our express app
    socketio = socketio.listen(server);

    socketio.sockets.on('connection', function(socket) {
        //start handling the connections
        //sockethandler(socket, connections);
    });

    if (this.server.address()) console.log('PrashFour started on port %s', this.server.address().port);
}