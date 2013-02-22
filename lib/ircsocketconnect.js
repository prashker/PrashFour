var irc = require('irc');
var config = require('../config');

var IRCSocketConnect = function(hostname, port, ssl, selfSigned, nick, realName, password, rejoin, away, encoding, keepAlive, channels) {
    var that = this;
    
    this.sockets = new Array();
    this.server = hostname;
    
    if (away === undefined || away == '')
        this.away = 'AFK';
    else
        this.away = away;
    
    var pPort = parseInt(port);
    if (!pPort)
        pPort = (ssl ? 6697 : 6667);
    
    if (channels === undefined || !rejoin)
        var channels = new Array();    
    
    //from http://node-irc.readthedocs.org/en/latest/
    this.client = new irc.Client(hostname, nick, {
        userName: nick,
        realName: realName,
        port: pPort,
        debug: true,
        showErrors: true,
        autoRejoin: true,
        autoConnect: true,
        channels: channels,
        //password: password, doesn't work right when password not defined
        secure: ssl,
        selfSigned: selfSigned,
        certExpired: false,
        floodProtection: true,
        floodProtectionDelay: 1000,
        stripColors: true,
        encoding: encoding
    });

    this.keepAlive = keepAlive;
    
    //All the events that need to be handled and forwarded to socket.io
    //from http://node-irc.readthedocs.org/en/latest/
    //just a nice way to say what I catch, and what parameters the function has
    this.events = {
        'join': ['channel', 'nick'],
        'part': ['channel', 'nick'],
        'quit': ['nick', 'reason', 'channels', 'message'],
        'topic': ['channel', 'topic', 'nick'],
        'nick': ['oldNick', 'newNick', 'channels'],
        'names': ['channel', 'nicks'],
        'message': ['from', 'to', 'text'],
        'pm': ['nick', 'text'],
        'motd': ['motd'],
        'notice': ['nick', 'to', 'text', 'message'],
        'error': ['message'],
        'netError': ['message'],
        'registered': ['message'],
    };
    
    // Add a listener on client for the given event & argument names
    this.activateListener = function (event, argNames) {
        that.client.addListener (event, function() {
            // Associate specified names with callback arguments
            var callbackArgs = arguments;
            var args = {};
            argNames.forEach(function(arg, index) {
                args[arg] = callbackArgs[index];
            });
            
            // loop through all sockets and emit events
            for (var i = 0; i < that.sockets.length; i++) {
                that.sockets[i].emit(event, args);
            }
        });
    };

    for (var event in this.events) {
        this.activateListener(event, this.events[event]);
    }
}

// properties and methods
IRCSocketConnect.prototype = {
    associateUser: function(username) {
        this.username = username;
    },
    clearUnreads: function() {
        for(key in this.client.chans){
            if(this.client.chans.hasOwnProperty(key)){
                var channel = this.client.chans[key];
                channel.unread_messages = 0;
                channel.unread_highlights = 0;
            }
        }
    },
    connect: function() {
        this.client.connect();
    },
    disconnect: function() {
        this.client.disconnect();
    },
    addSocket: function(socket) {
        this.sockets.push(socket);
    },
    removeSocket: function(socket) {
        var index = this.sockets.indexOf(socket);
        if (index != -1) this.sockets.splice(index, 1);
    },
};

//Make it a module that socket file can incorporate
module.exports = IRCSocketConnect;