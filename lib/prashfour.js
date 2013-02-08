var irc = require('irc');
var socketio = require('socket.io');
var app = require('./webserver').app;

//http://stackoverflow.com/questions/5311334/what-is-the-purpose-of-nodejs-module-exports-and-how-do-you-use-it
//EXPOSING http://visionmedia.github.com/masteringnode/book.html
var PrashFour = exports.PrashFour = function() {
	var self = this;
	self.socketio = socketio;
	self.irc = irc;
}

PrashFour.prototype.start = function () {
	var self = this;
}