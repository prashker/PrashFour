var IRCSocketConnect = require('./ircsocketconnect');
var mongoose = require('mongoose');

// establish models
var User = mongoose.model('User');
var Connection = mongoose.model('Connection');
var Message = mongoose.model('Message');

module.exports = function(socket, connections) {

    var current_user;
  
    socket.on('getDatabaseState', function(){
        socket.emit('databaseState', {state: mongoose.connection.readyState});
    });

    //https://groups.google.com/forum/?fromgroups=#!topic/socket_io/66oeLfcq_1I
    socket.on('latencyPING', function(data) {
        socket.emit("latencyPONG", {});
    });

    socket.on('register', function(data) {
        //Duplicate Username Check
        User.findOne({username: data.username}, function(err, u) {
            if (u) {
                socket.emit('register_error', {message: 'Username already exists'});
            }
            else {
                var user = new User();
                user.username = data.username;
                user.password = data.password;
                user.save(); //Save user in database
                current_user = user;
                socket.emit('register_success', {username: user.username});
            }
        });
    });

    socket.on('login', function(data) {
        User.findOne({username: data.username}, function(err, user) {
          if (user) {
            if (user.password == data.password) {
                var exists;
                current_user = user;
                if (connections[user.username] !== undefined) {
                    exists = true;
                }
                else {
                    exists = false;
                }
                socket.emit('login_success', {username: user.username, exists: exists});
            }
            else {
                //user exists, wrong pass
                socket.emit('login_error', {message: 'Wrong password'});
            }
          } 
          else {
            socket.emit('login_error', {message: 'No user'});
          }
        });
    });

    socket.on('connect', function(data) {  
        var connection;
        if (current_user) {
            connection = connections[current_user.username];
        }
        if (connection === undefined) {
            connection = new IRCSocketConnect(data.server, data.port, data.secure, data.selfSigned, data.nick, data.realName, data.password, data.rejoin, data.away, data.encoding, data.keepAlive);

            // save this connection
            if (current_user) {
                // bind this socket to the proper IRC instance
                connection.associateUser(current_user.username);

                var conn = new Connection({ user: current_user.username,
                    hostname: data.server,
                    port: data.port || (data.secure ? 6697 : 6667),
                    ssl: data.secure,
                    rejoin: data.rejoin,
                    away: data.away,
                    realName: data.realName,
                    selfSigned: data.selfSigned,
                    channels: data.channels,
                    nick: data.nick,
                    password: data.password,
                    encoding: data.encoding,
                    keepAlive: data.keepAlive
                });

                conn.save();
                connections[current_user.username] = connection;
            }
        } 
        else {
            if (!connection.keepAlive) {
                connection.connect();
            }
            socket.emit('restore_connection', {
                nick: connection.client.nick,
                server: connection.client.opt.server, 
                channels: connection.client.chans
            });
        }

        // register this socket with our user's IRC connection
        connection.addSocket(socket);

        // Socket events sent FROM the front-end
        socket.removeAllListeners('join');
        socket.on('join', function(name) {
            if (name[0] != '#') {
                name = '#' + name;
            }
            connection.client.join(name);
        });

        socket.removeAllListeners('part_pm');
        socket.on('part_pm', function(name){
            if (connection.client.chans[name.toLowerCase()] !== undefined) {
            delete connection.client.chans[name.toLowerCase()];
            }
        });

        socket.removeAllListeners('part');
        socket.on('part', function(name) {
            if (name[0] != '#') {
                name = '#' + name;
            }

            connection.client.part(name);
            if (current_user) {
                // update the user's connection / channel list
                Connection.update({ user: current_user.username }, { $pull: { channels: name.toLowerCase() } }, function(err) {});
            }
        });

        socket.removeAllListeners('say');
        socket.on('say', function(data) {
            //send it
            connection.client.say(data.target, data.message);
            //send back to client (takes into account lag/success)
            socket.emit('message', {to:data.target.toLowerCase(), from: connection.client.nick, text:data.message});
            if (current_user) {
                connection.logMessage(data.target, connection.client.nick, data.message);
            }
        });

        socket.removeAllListeners('action');
        socket.on('action', function(data) {
            connection.client.action(data.target, data.message);
            socket.emit('message', {
                to: data.target.toLowerCase(),
                from: connection.client.nick,
                text: '\u0001ACTION ' + data.message} // \u0001 is the thing that apparently makes it an ACTION
            );
        });

        socket.removeAllListeners('topic');
        socket.on('topic', function(data) {
            connection.client.send('TOPIC ', data.name, data.topic);
        });

        socket.removeAllListeners('nick');
        socket.on('nick', function(data) {
            connection.client.send('NICK', data.nick);
            connection.client.nick = data.nick;
            connection.client.opt.nick = data.nick;
        });

        socket.removeAllListeners('disconnect');
        socket.on('disconnect', function() {
            if (!current_user) {
                // not logged in, drop this session
                connection.disconnect();
            } 
            else if (connection.keepAlive) {
                // keep the session alive, remove this socket
                connection.removeSocket(socket);
            }
            else {
                // disconnect the session
                connection.disconnect();
            }
        });

        socket.removeAllListeners('disconnectServer');
        socket.on('disconnectServer', function() {
            connection.disconnect();
            connection = null;

            // remove current user and connect
            if (current_user) {
                connections[current_user.username].disconnect();
                connections[current_user.username] = undefined;
                Connection.find({user: current_user.username}).remove();
                current_user = null;
            }

            socket.emit('reset');
        });

        socket.removeAllListeners('getOldMessages');
        socket.on('getOldMessages', function(data){
            if (current_user) {
                var query = Message.find({channel: data.channelName.toLowerCase(), server: connection.server.toLowerCase(), linkedto: current_user.username});

                query.limit(data.amount); //Get data.amount backlog
                query.sort({date: -1}); //Reverse date (expected order)
                query.skip(data.skip); //Skip a few

                query.exec(function (err, results) {
                    if (results) {
                        var returnData = {};
                        if (results && results.length > 0) {
                            returnData.name = data.channelName.toLowerCase();
                            returnData.messages = results;
                        }   
                        socket.emit('oldMessages', returnData);
                    }
                });
            }
        });
    });
}