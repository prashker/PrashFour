var IRCSocketConnect = require('./ircsocketconnect');
var mongoose = require('mongoose');
var passwordHash = require('password-hash');

// establish models
var User = mongoose.model('User');
var Message = mongoose.model('Message');

module.exports = function(socket, allConnections) {
    var loggedInUser;
  
    //https://groups.google.com/forum/?fromgroups=#!topic/socket_io/66oeLfcq_1I
    socket.on('latencyPING', function(data) {
        socket.emit("latencyPONG", {});
    });
  
    //Checks the state of the database
    //http://mongoosejs.com/docs/api.html#connection_Connection-readyState
    socket.on('isDatabaseConnected', function(){
        socket.emit('isDatabaseConnected', {state: mongoose.connection.readyState});
    });

    socket.on('register', function(data) {
        //Duplicate Username Check
        User.findOne({username: data.username}, function(err, userAlreadyExists) {
            //No need to check any other details, if it matches username, it is a duplicate
            if (userAlreadyExists) {
                socket.emit('register_error', {message: 'Username already exists'});
            }
            else {
                //Generate a session ID
                var sessID = Math.random().toString(36);
                //Store it in the DB concatenated with the IP
                var user = new User({username: data.username, password: passwordHash.generate(data.password), lastSession: sessID + socket.handshake.address.address});
                user.save(); //Save user in database
                loggedInUser = user;
                socket.emit('register_success', {session: sessID}); //Pass sessID to client
            }
        });
    });

    socket.on('login', function(data) {
        User.findOne({username: data.username}, function(err, matchingUser) {
            //Found a user
            if (matchingUser) {
                //Matching password
                if (passwordHash.verify(data.password, matchingUser.password)) {
                    var establishedConnectionExists;
                    
                    loggedInUser = matchingUser;
                    if (allConnections[matchingUser.username] !== undefined) {
                        establishedConnectionExists = true; //Was "keepAlive" of a previous connection checked
                    }
                    else {
                        establishedConnectionExists = false;
                    }
                    
                    //SESSION ID GENERATOR
                    //http://stackoverflow.com/questions/1349404/generate-a-string-of-5-random-characters-in-javascript
                    var sessID = Math.random().toString(36);
                    matchingUser.update({lastSession: sessID + socket.handshake.address.address}, function(err) {});
                    socket.emit('login_success', {username: matchingUser.username, establishedConnectionExists: establishedConnectionExists, session: sessID});
                }
                else {
                    //user exists, wrong pass
                    socket.emit('login_error', {message: 'Wrong password'});
                }
            }
            //No user
            else {
                socket.emit('login_error', {message: 'No user'});
            }
        });
    });
    
    //Called when the client has a sessID and calls loginBySession
    socket.on('loginBySession', function (data) {
        User.findOne({lastSession: data.session + socket.handshake.address.address}, function(err, matchingUser) {
            //Found a user
            if (matchingUser) {
                var establishedConnectionExists;
                loggedInUser = matchingUser;
                if (allConnections[matchingUser.username] !== undefined) {
                    establishedConnectionExists = true;
                }
                else {
                    establishedConnectionExists = false;
                }
                socket.emit('login_success', {username: matchingUser.username, establishedConnectionExists: establishedConnectionExists, session: data.session});
            }
            //No user
            else {
                socket.emit('login_error', {message: 'Fake session? Error'});
            }
        });    
    });

    //When the client calls connect
    socket.on('connect', function(data) {  
        var connection;
        
        //If loggedIn, return the connection that exists
        if (loggedInUser) {
            connection = allConnections[loggedInUser.username];
        }
        
        //Create a new connection with the data specified if it wasn't
        if (connection === undefined) {
            connection = new IRCSocketConnect(data.server, data.port, data.secure, data.selfSigned, data.nick, data.realName, data.password, data.rejoin, data.encoding, data.keepAlive);

            // save this connection
            // associate if they are logged in
            if (loggedInUser) {
                // bind this socket to the proper IRC instance
                connection.associateUser(loggedInUser.username);
                allConnections[loggedInUser.username] = connection;
            }
        } 
        else {
            //Notify the client of the previous connection, with the channel, server, and nick associated with the connection
            socket.emit('previous_connection', {
                nick: connection.nodeircInstance.nick,
                server: connection.nodeircInstance.opt.server, 
                channels: connection.nodeircInstance.chans
            });
        }

        // register this socket with our user's IRC connection
        connection.addSocket(socket);

        // Socket events sent FROM the front-end
        //Join #chan or "chan" -> #chan        
        socket.removeAllListeners('join');
        socket.on('join', function(name) {
            if (name[0] != '#') {
                name = '#' + name;
            }
            //Calls join
            connection.nodeircInstance.join(name);
        });

        //Part channel
        //Part #chan or "chan" -> #chan
        socket.removeAllListeners('part');
        socket.on('part', function(name) {
            if (name[0] != '#') {
                name = '#' + name;
            }
            //Calls part
            connection.nodeircInstance.part(name);
        });

        //Clients sends a message
        socket.removeAllListeners('say');
        socket.on('say', function(data) {
            //send it
            connection.nodeircInstance.say(data.target, data.message);
            //send back to nodeircInstance (takes into account lag/success)
            
            for (var i = 0; i < connection.sockets.length; i++) {
                connection.sockets[i].emit('message', {to:data.target.toLowerCase(), from: connection.nodeircInstance.nick, text:data.message});
            }
            
            if (loggedInUser) {
                connection.logMessage(data.target, connection.nodeircInstance.nick, data.message);
            }
        });

        //ACTION command
        socket.removeAllListeners('action');
        socket.on('action', function(data) {
            connection.nodeircInstance.action(data.target, data.message);
            socket.emit('message', {
                to: data.target.toLowerCase(),
                from: connection.nodeircInstance.nick,
                text: '\u0001ACTION ' + data.message} // \u0001 is the thing that apparently makes it an ACTION
            );
        });

        //CHANGE of TOPIC via Client
        socket.removeAllListeners('topic');
        socket.on('topic', function(data) {
            //No handling if they have the permissions, assumes they are OP (will error if not, but won't report to client)
            connection.nodeircInstance.send('TOPIC ', data.name, data.topic);
        });

        socket.removeAllListeners('nick');
        socket.on('nick', function(data) {
            //How to change the nick
            //https://github.com/martynsmith/node-irc/issues/149
            connection.nodeircInstance.send('NICK', data.newNick);
            //Directly change .nick and opt.nick
            //https://github.com/martynsmith/node-irc/pull/139
            connection.nodeircInstance.nick = data.newNick;
            connection.nodeircInstance.opt.nick = data.newNick;
        });
        
        //WHOIS call
        socket.removeAllListeners('whois');
        socket.on('whois', function(data) {
            //Do a WHOIS on NICK
            connection.nodeircInstance.whois(data.nick);
        });

        socket.removeAllListeners('disconnect');
        socket.on('disconnect', function() {
            if (!loggedInUser) {
                // not logged in, drop this session
                connection.disconnect();
            } 
            else if (connection.keepAlive || connection.sockets.length >= 2) {
                // remove the socket and keep the connection alive if there are more than 1 active logged in instances
                // keep the session alive, remove this socket
                connection.removeSocket(socket);
            }
            else {
                //If we are logged in, disconnected (closing window)
                //Then get rid of the connection
                allConnections[loggedInUser.username] = undefined;
                connection.disconnect();
            }
        });

        socket.removeAllListeners('disconnectServer');
        socket.on('disconnectServer', function() {
            connection.disconnect();
            connection = null;

            // remove current user and connect
            if (loggedInUser) {
                allConnections[loggedInUser.username].disconnect();
                allConnections[loggedInUser.username] = undefined;
                loggedInUser = null;
            }
            
            //Manually disconnected via client end, tell client to go back to main menu via reset
            socket.emit('reset');
        });

        socket.removeAllListeners('getOldMessages');
        socket.on('getOldMessages', function(data) {
            if (loggedInUser) {
                //Query to get messages in a channel on a certain network of a certain username
                Message.find({channel: data.channelName.toLowerCase(), server: connection.server.toLowerCase(), ofuser: loggedInUser.username}, null, {skip: data.skip, sort: {date: -1}, limit: data.amount}, function (err, docs) {
                    if (docs && docs.length > 0) {
                        var returnData = {
                            name: data.channelName.toLowerCase(),
                            messages: docs
                        };
                        socket.emit('oldMessages', returnData);
                    }
                });
            }
        });
        
        //List for the server
        socket.removeAllListeners('list');
        socket.on('list', function (data) {
            //LONG RUNNING
            connection.nodeircInstance.list(); //takes an array of arguments, but we don't pass it (not needed)
        });
        
    });
}
