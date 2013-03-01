var irc = require('irc');
var mongoose = require('mongoose');
var config = require('../config');

// establish models
var User = mongoose.model('User');
var Connection = mongoose.model('Connection');
var Message = mongoose.model('Message');

var IRCSocketConnect = function(hostname, port, ssl, selfSigned, nick, realName, password, rejoin, encoding, keepAlive, channels) {
    var that = this;
    
    this.sockets = new Array();
    this.server = hostname;
    
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
        'action': ['from', 'to', 'text'],
    };
    
    // Add a listener on client for the given event & argument names
    this.activateListener = function (event, argNames) {
        that.client.addListener (event, function() {
            //This method forwards everything to the client end, atleast all events that the above has

        
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

            //Besides sending to client, do server side stuff
            
            if (event == 'message') {
                if (that.username) {
                    var target;
                    if (args.to[0] != '#')
                        target = args.from.toLowerCase();
                    else
                        target = args.to.toLowerCase();
                        
                    // log this message
                    that.logMessage(target, args.from, args.text);
                }
            }
            
            // This is the logic to assign a user to log messages on join
            if (event == 'join') {
                var target = args.channel.toLowerCase();

                if (that.username && rejoin) {
                    // update the user's channel list
                    //http://docs.mongodb.org/manual/reference/operator/addToSet/
                    //Adds extra channels to this user
                    Connection.update({ user: that.username }, { $addToSet: { channels: target } }, function(err) {});
                }
            }
            
            if (event == 'part') {
            
            }
            
            if (event == 'quit') {
            
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
    logMessage: function(target, from, msg) {
        if (this.username) {
            var message = new Message({channel: target.toLowerCase(), server: this.server.toLowerCase(), linkedto: this.username, user: from, message: msg});
            message.save();
            
            // keep log size in check
            Message.count({}, function(err, count) {
                if (count > config.config.max_log) {
                    var query = Message.find({});

                    query.limit(count - config.config.max);
                    query.sort({date: 1});
                    
                    query.exec(function (err, records) {
                        records.forEach(function(record){
                            record.remove();
                        });
                    });
                }
            });
        }
    }
};

//Make it a module that socket file can incorporate
module.exports = IRCSocketConnect;