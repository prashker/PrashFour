var irc = require('irc');
var mongoose = require('mongoose');
var config = require('../config').config;

// establish models from mongoose model
var User = mongoose.model('User');
var Message = mongoose.model('Message');

var IRCSocketConnect = function (hostname, port, ssl, selfSigned, nick, realName, password, rejoin, encoding, keepAlive, channels) {
    var that = this;
    
    this.sockets = new Array();
    this.server = hostname;
    
    var parsedPort = parseInt(port);
    if (!parsedPort)
        parsedPort = (ssl ? 6697 : 6667);
    
    if (channels === undefined || !rejoin)
        var channels = new Array();    
    
    //from http://node-irc.readthedocs.org/en/latest/
    var connectOptions = {
        userName: nick,
        realName: realName,
        port: parsedPort,
        debug: true,
        showErrors: true,
        autoRejoin: rejoin,
        autoConnect: true, //Setting autoConnect to false prevents the Client from connecting on instantiation. You will need to call connect() on the client instance:
        channels: channels, //Starting channels, for this will be null usually (no client fields yet)
        secure: ssl, //SORT OF BROKEN
        selfSigned: selfSigned, //SORT OF BROKEN
        certExpired: false,
        floodProtection: true,
        floodProtectionDelay: 1000,
        stripColors: true,
        retryCount: 1,
        encoding: encoding
    };
    
    if (password) {
        //node-irc interprets "" password as blank, this is a workaround
        connectOptions.password = password;
    }
    
    this.nodeircInstance = new irc.Client(hostname, nick, connectOptions);
    this.keepAlive = keepAlive; //Used when logged in user wants to restore active connection
    
    //All the events that need to be handled and forwarded to socket.io
    //from http://node-irc.readthedocs.org/en/latest/
    //just a nice way to say what I catch, and what parameters the function has
    this.events = {
        'join': ['channel', 'nick'],
        'part': ['channel', 'nick'],
        'quit': ['nick', 'reason', 'channels', 'message'],
        'topic': ['channel', 'topic', 'nick'],
        'nick': ['oldNick', 'newNick', 'channels', 'message'],
        'names': ['channel', 'nicks'],
        'message': ['from', 'to', 'text'],
        'pm': ['nick', 'text'],
        'motd': ['motd'],
        'notice': ['nick', 'to', 'text', 'message'],
        'error': ['message'],
        'netError': ['message'],
        'abort': ['retryCount'],
        'registered': ['message'],
        'action': ['from', 'to', 'text'],
        'whois': ['info'],
        'channellist': ['channel_list'] // Emitted when the server has finished returning a channel list. The channel_list array is simply a list of the objects that were returned in the intervening channellist_item events.
    };
    
    // Add a listener on client for the given event & argument names
    this.callbackCreator = function (event, argNames) {
        //How to add a listnener for a specific event
        //https://node-irc.readthedocs.org/en/latest/index.html?highlight=addListener
        that.nodeircInstance.addListener (event, function() {
            //This method forwards everything to the client end, atleast all events that the above has
            //Using a nice loop to generate the callback function, rather than manually do it for each

            // Associate specified names with callback arguments
            var callbackArgs = arguments; //arguments being a javascirpt global thing for the function - node-irc is sending these arguments to this event
            var args = {};
            argNames.forEach(function(arg, index) {
                args[arg] = callbackArgs[index]; //taking them, and formatting them the exact way node-irc does, but in an object that can be sent via sockets
            });
            
            // emit the event
            for (var i = 0; i < that.sockets.length; i++) {
                that.sockets[i].emit(event, args);
            }
            
            //If it is a message, we want to log that
            if (event == 'message') {
                if (that.username) {
                    var channelOrUser;
                    if (args.to[0] != '#') //PM workaround
                        channelOrUser = args.from.toLowerCase(); //PM, which means to is ME, so we want them
                    else
                        channelOrUser = args.to.toLowerCase(); //Normal message, should be #channel
                        
                    // log this message
                    that.logMessage(channelOrUser, args.from, args.text);
                }
            }
                        
        });
    };

    //Attach event handlers for the stuff node-irc spews out
    for (var event in this.events) {
        this.callbackCreator(event, this.events[event]);
    }
}

// properties and methods
IRCSocketConnect.prototype = {
    associateUser: function(username) {
        //Attach the users username to this instance
        this.username = username;
    },
    connect: function() {
        //Calls node-irc's connect
        this.nodeircInstance.connect();
    },
    disconnect: function() {
        //Calls node-irc's disconnect
        this.nodeircInstance.disconnect();
    },
    addSocket: function(socket) {
        this.sockets.push(socket);
    },
    removeSocket: function(s) {
        //Remove the socket if it exists
        var foundSocket = this.sockets.indexOf(s);
        if (foundSocket != -1) { 
            this.sockets.splice(foundSocket, 1); //At index foundSocket, remove 1
        }
    },
    logMessage: function(channel, fromUser, theMessage) {
        //If we're logged in
        if (this.username) {
            //Save the message
            var message = new Message({channel: channel.toLowerCase(), server: this.server.toLowerCase(), ofuser: this.username, user: fromUser, message: theMessage});
            message.save();
            
            // keep log size in check (only need so much backlog for each user
            //Remove the excess messages (can increase pretty big for a zillion users so we limit it via config.js)
            Message.count({}, function(err, count) {
                if (count > config.max_log) {
                    //Get the oldest messages
                    
                    Message.find({}, null, {sort: {date: 1}, limit: count - config.max}, function (err, records) {
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