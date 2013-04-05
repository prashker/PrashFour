//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.9.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/bootstrap.min.js'
//= require 'libs/moment.min.js'
//= require 'libs/jquery.pnotify.min.js
//= require 'models.js'
//= require 'collections.js'
//= require 'router.js'
//= require_tree 'BackboneViews'

//connect-assets require statements, similar to doing script() in Jade, but allows it to be a little more seperate (Jade for HTML frame stuff, connect-assets/snockets for JS requirements and depencencies)

window.irc = {
    //From //https://github.com/LearnBoost/socket.io-client/issues/251#issuecomment-2283801
    //PORT is a global variable handed by Jade
    socket: io.connect(null, {'force new connection': true, port: PORT}),
    chatWindows: new WindowList(),
    connected: false,
    loggedIn: false,
    latencyStats: {
        'lastEmitTime': Date.now(),
        'lastPing': 0,
        'totalPing': 0,
        'numOfPings': 0
    },
    unifiedReplace: function (text) {
        //url and emoticons
        //http://stackoverflow.com/questions/9200355/javascript-converting-plain-text-to-links-smilies
        
        // First pass: creating url and smilie maps
        var urlSubstitutions = [];
        var smilieSubstitutions = [];
        
        var smilies = {
            ':)' : 'smile.gif',
            ':(' : 'sad.gif',
            ':S' : 'confused.gif',
            ':D' : 'grin.gif',
            ':/' : 'rolleyes.gif',
            ':o' : 'surprised.gif',
            ':p' : 'tongue.gif',
            ';)' : 'wink.gif',
        }

        text = text.replace(/\b((http:\/\/)|(www\.))[^ ]{5,}/g, function(match) {
            var b = match;
            if (b.indexOf("www") == 0) {
                b = "http://" + b;
            }

            urlSubstitutions.push({ anchor: match, url: b });
            return "{{_u_" + urlSubstitutions.length + "_}}";
        });
        
        for (s in smilies) {
            text = text.replace(new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "g"), function(x){
                smilieSubstitutions.push({ smilie: x, image: smilies[s] });
                return "{{_s_" + smilieSubstitutions.length + "_}}";
            });
        }
        
        // Second pass: applying urls and smilies
        text = text.replace(/{{_u_(\d+)_}}/g, function(match, index) {
            var substitution = urlSubstitutions[parseInt(index)-1];
            return '<a href="' + substitution.url + '" target="_blank">' + substitution.anchor + "</a>";
        });

        text = text.replace(/{{_s_(\d+)_}}/g, function(match, index) {
            var substitution = smilieSubstitutions[parseInt(index)-1];
            return '<img src="/images/' + substitution.image + '"/>';
        });

        return text;
    },
    highlightReplace: function(text) {
        var re = new RegExp(irc.me.get('nick').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), 'g');
        var parsed = text.replace(re, function(nick) {
            return '<span class="highlight">' + nick + '</span>';
        });
        return parsed;
    }
};

//The main running block, handles all the events the server sends our way

$(function() {
    irc.appView = new ChatApplicationView();
    
    //Session Login
    //http://jsperf.com/localstorage-in-versus-hasownproperty
    //If we already have a session key, tell the server to login via our key
    if ('session' in localStorage) {
        irc.socket.emit('loginBySession', {session: localStorage.getItem('session')});
    }

    //https://groups.google.com/forum/?fromgroups=#!searchin/socket_io/latency/socket_io/66oeLfcq_1I/Hv2D6U0F5qAJ
    //Ping loop, continually ping the server and maintain the data on the client size for the course of the session
    irc.socket.on('latencyPONG', function() {
    
        irc.latencyStats.lastPing = Date.now() - irc.latencyStats.lastEmitTime;
        irc.latencyStats.totalPing += irc.latencyStats.lastPing;
        irc.latencyStats.numOfPings++;
        
        setTimeout(function() {
            irc.latencyStats.lastEmitTime = Date.now();
            irc.socket.emit('latencyPING', {});
        }, 10000);
    });
    irc.latencyStats.lastEmitTime = Date.now();
    irc.socket.emit('latencyPING', {});

    //Emits and handles the query to the server if the database is up and running (and connected)
    irc.socket.emit('isDatabaseConnected', {});
    irc.socket.on('isDatabaseConnected', function(data) {
        if (data.state == 0) {
            irc.appView.notifyError('Database Error', "Cannot connect to database, removing DB buttons");
            $('#login, #register').hide(); //Hide the buttons if state = inactive (probably off)
        }
    });

    // Registration (server joined)
    irc.socket.on('registered', function(data) {
        irc.connected = true;
        //Create the status window (if it wasn't created by a NOTICE before)
        if (irc.chatWindows.getByName('status') === undefined) {
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
        } 
        else {
            irc.appView.renderUserBox();
        }

        // Will reflect modified nick, if chosen nick was taken already
        irc.me.set('nick', data.message.args[0]);
        
        irc.appView.notifySuccess("Connected", "Welcome " + data.message.args[0]);
    });

    //Successfully logged in
    irc.socket.on('login_success', function(data) {
        window.irc.loggedIn = true;
        //Store the session key the server sends us
        localStorage.setItem('session', data.session);
        
        irc.appView.notifySuccess("Login Success", "Logged in as " + data.username);
        
        if (data.establishedConnectionExists) {
            //Connect back to established connection
            irc.socket.emit('connect', {});
            irc.appView.notifySuccess("Restoring connection", "Previous connection exists, attaching...");
        } else {
            //Load the connection dialog mainview_connection
            irc.appView.mainview.render({currentTarget: {id: "connection"}});
        }
    });

    
    //This would normally happen if the node instance dies
    irc.socket.on('disconnect', function() {
        //Notification
        irc.appView.notifySuccess("Disconnected", "The node server has most likely died, disconnecting...");
        
        //Make the window seem unclickable anymore (can't necessarily throw a 404 so this is the best we can do)
        $('.backboneAllWrap').css('opacity', '0.5');
        
        irc.loggedIn = false;
        irc.connected = false;
    });

    //Once a registration goes through successfully
    irc.socket.on('register_success', function(data) {
        //Automatically login via registration
        irc.loggedIn = true;
        
        //Store the session automatically (bugfix)
        localStorage.setItem('session', data.session);
        
        //Show the connection window
        irc.appView.mainview.render({currentTarget: {id: "connection"}});
        
        //Notification
        irc.appView.notifySuccess("Registration success", "You have now registered, logged in");
    });

    
    //Called if we've logged in and there exists a previous connection (means the user had checked off the "keep alive" box
    irc.socket.on('previous_connection', function(data) {
        //Do setup similar to on 'registered', but with pre-existing values
        irc.me = new User({nick: data.nick, server: data.server});
        irc.connected = true;
        irc.appView.render();
        irc.appView.renderUserBox();
        irc.chatWindows.add({name: 'status', type: 'status'});
        
        
        //For each channel we're currently in
        $.each(data.channels, function(key, value) {
            //Get the channel name
            var chanName = value.serverName.toLowerCase();
            
            //Create the channel
            irc.chatWindows.add({name: chanName});
            
            //Retrieve the Model
            var channel = irc.chatWindows.getByName(chanName);
            
            //Set the data held by PrashFour (topic, unread data)
            channel.set({
                topic: value.topic,
                unread: 0,
                unreadHighlights: 0
            });
            
            //Create the userlist
            if (chanName[0] == '#') {
                channel.userList = new UserList(channel);
                //For each user, wrap them into a user Model, and add to the userList
                $.each(value.users, function(user, prefix) {
                    channel.userList.add(new User({nick: user, prefix: prefix}));
                });
                irc.socket.emit('getOldMessages',{channelName: chanName, skip:0, amount: 50});
            }
        });

        $('.channel:first').click(); //Switch to the first tab
    });
    
    //Notices are usually sent to the status window (mIRC option)
    irc.socket.on('notice', function(data) {
        var statusWindow = irc.chatWindows.getByName('status');
        //This could be BEFORE on('registered'), so create status window accordingly
        if (statusWindow === undefined) {
            irc.connected = true;
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
            statusWindow = irc.chatWindows.getByName('status');
        }
        var sender = data.nick || 'notice';
        statusWindow.messageList.add({sender: sender, text: data.text, type: 'notice'});
    });

    // Message of the Day (Added to the Status Window)
    irc.socket.on('motd', function(data) {
        //MOTD usually indicates that the final step in connection has been done (aka you can actually join a channel)
        var message = new Message({sender: 'status', text: data.motd, type: 'motd'});
        irc.chatWindows.getByName('status').messageList.add(message);
    });

    //Important metho,d handle a message
    irc.socket.on('message', function(data) {
        //Get the chat window for it
        if (data.to.substr(0, 1) === '#') {
            var chatWindow = irc.chatWindows.getByName(data.to.toLowerCase());
            chatWindow.messageList.add(new Message({sender: data.from, text: data.text, type: 'message'}));
        }
        else {
             var pmWindow = irc.chatWindows.getByName(data.to.toLowerCase());
             pmWindow.messageList.add(new Message({sender: data.from, text: data.text, type: 'pm'}));       
        }
    });
    
    //Bug Fix Issue ACTION (WORKAROUND)
    irc.socket.on('action', function(data) {
        var chatWindow = irc.chatWindows.getByName(data.to.toLowerCase());
        var type = 'message';
        if (data.to.substr(0, 1) === '#') {
            chatWindow.messageList.add({sender: data.from, text: ' ACTION ' + data.text, type: type});
        } 
        else if (data.to !== irc.me.get('nick')) {
            chatWindow.messageList.add({sender: data.from.toLowerCase(), text: ' ACTION ' + data.text, type: 'pm'});
        }
    });

    //On a private message from another user
    irc.socket.on('pm', function(data) {
        //Find the window or create one
        var chatWindow = irc.chatWindows.getByName(data.nick.toLowerCase());
        if (chatWindow === undefined) {
            irc.chatWindows.add({name: data.nick.toLowerCase(), type: 'pm'});
            //Even private messages can have backlogs
            irc.socket.emit('getOldMessages',{channelName: data.nick.toLowerCase(), skip:0, amount: 50});
            chatWindow = irc.chatWindows.getByName(data.nick.toLowerCase());
        }
        chatWindow.messageList.add({sender: data.nick, text: data.text, type: 'pm'});
    });

    //When a user joins the channel
    irc.socket.on('join', function(data) {
        var chanName = data.channel.toLowerCase();
        //If that user is me (aka I successfully joined a channel)
        //Request the backlog
        if (data.nick === irc.me.get('nick')) {
            irc.chatWindows.add({name: chanName});
            irc.socket.emit('getOldMessages', {channelName: chanName, skip:0, amount: 50});
        } 
        else {
            //Someone else joined, setup the message, and add them in
            var channel = irc.chatWindows.getByName(chanName);
            if (typeof channel === 'undefined') {
                irc.chatWindows.add({name: chanName});
                channel = irc.chatWindows.getByName(chanName);
            }
            channel.userList.add(new User({nick: data.nick, prefix: data.prefix}));
            var joinMessage = new Message({type: 'join', nick: data.nick});
            channel.messageList.add(joinMessage);
        }
    });

    //Someone parted
    irc.socket.on('part', function(data) {
        var chanName = data.channel.toLowerCase();
        var channel = irc.chatWindows.getByName(chanName);
        //If I parted
        if (data.nick === irc.me.get('nick')) {
            channel.part();
        } 
        else {
            //If someone else parted, destroy them from the userList
            var user = channel.userList.getByNick(data.nick);
            user.view.remove();
            user.destroy();
            //Put a part message into the chat window
            var partMessage = new Message({type: 'part', nick: data.nick});
            channel.messageList.add(partMessage);
        }
    });

    //If someone has quit the server
    irc.socket.on('quit', function(data) {
        //Find every channel that the user was in (server sends that to us)
        for (var i in data.channels) {
            var channel = irc.chatWindows.getByName(data.channels[i]);
            //Find out if we were in that channel
            if (channel !== undefined) {
                //If we were, destroy them from the userList
                var user = channel.userList.getByNick(data.nick);
                user.view.remove();
                user.destroy();
                //And display a quit message with the data why they left
                var quitMessage = new Message({type: 'quit', nick: data.nick, reason: data.reason, message: data.message});
                channel.messageList.add(quitMessage);
            }
        }
    });

    //Server has sent us the list of users in a channel
    irc.socket.on('names', function(data) {
        //Get the channel
        var channel = irc.chatWindows.getByName(data.channel.toLowerCase());
        
        //NAMES is only sent on a new channel, so create a UserList
        channel.userList = new UserList(channel);
        
        //For each nickname and their prefix (OP status)
        $.each(data.nicks, function(nick, prefix) {
            channel.userList.add(new User({nick: nick, prefix: prefix}));
        });
        
        //Notify the handleInput method
        channel.view.handleInput(); //Recalculate typeahead SOURCE
    });

    //Server has sent us that someone has changed their nickname
    irc.socket.on('nick', function(data) {
        //If it was you
        if (data.oldNick === irc.me.get('nick')) {
            irc.me.set('nick', data.newNick);
            irc.appView.renderUserBox(); //re-render userbox
        }
        
        // Add nickmessage to all channels
        // Adjust views
        var nickMessage = new Message({type: 'nick', oldNick: data.oldNick, newNick: data.newNick});
        for (var i in data.channels) {
            var channel = irc.chatWindows.getByName(data.channels[i]);
            if (channel) {
                var userInChannelList = channel.userList.getByNick(data.oldNick); //Get the user from the channel userList
                userInChannelList.set({nick: data.newNick}); //Change the nick value
                userInChannelList.view.render(); //Rerender it
                channel.messageList.add(nickMessage);
            }
        }
        
    });

    //Server has sent us TOPIC ON JOIN or ON CHANGE
    irc.socket.on('topic', function(data) {
        //Get the channel
        var channel = irc.chatWindows.getByName(data.channel.toLowerCase());
        
        //Change the topic
        channel.set({topic: data.topic});
        
        //Add a topic change message to the messageList
        var topicMessage = new Message({type: 'topic', nick: data.nick, topic: irc.unifiedReplace(data.topic)});
        channel.messageList.add(topicMessage);
    });

    //Handler of node-irc "error" event
    irc.socket.on('error', function(data) {
        //Basically output it to 'status' as a notice
        var window = irc.chatWindows.getByName('status');
        if (window === undefined) {
            irc.connected = true;
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
            window = irc.chatWindows.getByName('status');
        }
        window.messageList.add({sender: 'error', text: data.message.args.join(), type: 'notice'});
    });

    //Handler of node-irc "netError", most likely a connection failure/ban/etc
    irc.socket.on('netError', function(data) {
        irc.appView.notifyError('netError', data.message.code);
    });
    
    //Sent by server when it has given up on connecting
    irc.socket.on('abort', function (data) {
        //Remove the loading spinner
        $('.icon-spinner').remove();
        
        $('#connect-button').removeClass('disabled'); //Make connect button active again
        irc.appView.notifyError('Abort', "Aborting Connection");
    });

    //Login Failure
    irc.socket.on('login_error', function(data) {
        //Remove the session (doesn't matter if there was one) on a login error
        localStorage.removeItem('session');
        irc.appView.notifyError("Login Error", data.message);
    });

    //Register Failure
    irc.socket.on('register_error', function(data) {
        irc.appView.notifyError("Register Error", data.message);
    });

    //Restore to Initial State
    irc.socket.on('reset', function(data) {
        irc.chatWindows = new WindowList();
        irc.connected = false;
        irc.loggedIn = false;
        irc.me = null;

        // move to main view
        irc.appView.render();

        // remove login and register button if no database
        irc.socket.emit('isDatabaseConnected', {});
    });
    
    irc.socket.on('whois', function(data) {
        //RESPONSE FORMAT
        /*
            {
                nick: "Ned",
                user: "martyn",
                host: "10.0.0.18",
                realname: "Unknown",
                channels: ["@#purpledishwashers", "#blah", "#mmmmbacon"],
                server: "*.dollyfish.net.nz",
                serverinfo: "The Dollyfish Underworld",
                operator: "is an IRC Operator"
            }
        */
        var activeMessageList = irc.chatWindows.getActive().messageList;
        if (data.info) {
            for (var whoisKey in data.info) {
                var message = new Message({sender: "WHOIS", text: data.info[whoisKey], type: 'whois'});
                activeMessageList.add(message);
            }
        }
        
    });      
      
    //Restore old messages for a channel/pm
    irc.socket.on('oldMessages', function(data) {
        var channel = irc.chatWindows.getByName(data.name);
        if (data.messages) {
            $.each(data.messages, function(index, message) {  
                channel.messageList.add(new Message({sender: message.user + ' [Backlog]', 
                    timeStamp: moment(message.date).format('ddd MMM D YYYY, h:mmA'), 
                    text: message.message, 
                    type: 'backlog'})
                );
            });
        }
    });

    //Received the channellist from the server (WARNING: USUALLY TAKES LONG)
    irc.socket.on('channellist', function(data) {
        var window = irc.chatWindows.getByName('list');
        if (window === undefined) {
            irc.chatWindows.add({name: 'list', type: 'list'});
        }    
        var listMessageList = irc.chatWindows.getByName('list').messageList;
        if (listMessageList) {
            for (var index in data.channel_list) {
                var message = new Message({sender: data.channel_list[index].name , text: "Num Users: " + data.channel_list[index].users + " Topic: " + data.channel_list[index].topic , type: 'list'});        
                listMessageList.add(message);
            }
        }
    });

    //The block that handles all the /commands sent from the input-box, a simple switch block
    irc.commandHandle = function (command) {
        switch (command[0]) {
            case '/join':
                irc.socket.emit('join', command[1]);
                break;
            
            case '/part':
                //If a channel name was specified
                if (command[1]) {
                    irc.socket.emit('part', command[1]);
                    irc.appView.channelList.channelTabs[0].setActive();
                } 
                //If not part the active channel
                else {
                    irc.socket.emit('part', irc.chatWindows.getActive().get('name'));
                    irc.chatWindows.getActive().destroy();
                    irc.appView.channelList.channelTabs[0].setActive();
                }
                break;
                
            case '/nick':
                if (command[1]) {
                    irc.socket.emit('nick', {newNick: command[1]});
                }
                break;
            
            case '/topic':
                //Change active topic (obviously won't work if you don't have permissions)
                irc.socket.emit('topic', {
                    name: irc.chatWindows.getActive().get('name'),
                    topic: command.splice(1).join(' '),
                });
                break;
                
            case '/me': 
                //Action command (fun stuff)
                irc.socket.emit('action', {
                    target: irc.chatWindows.getActive().get('name'),
                    message: command.splice(1).join(' '),
                });
                break;
            
            case '/query': 
                //Open a private message with a user
                var nick = command[1].toLowerCase();
                if (typeof irc.chatWindows.getByName(nick) === 'undefined') {
                    irc.chatWindows.add({name: nick, type: 'pm'});
                }
                irc.socket.emit('getOldMessages', {channelName: nick, skip:0, amount: 50});
                break;
                
            case '/whois':
                var nick = command[1].toLowerCase();
                irc.socket.emit('whois', {nick: nick});
                break;
                
            case '/ping': 
                if (command[1]) {
                    alert("USER PING NOT IMPLEMENTED (only realized late in the game that it is not handled by node-irc)");
                }
                else {
                    var activeMessageList = irc.chatWindows.getActive().messageList;
                    var message = new Message({sender: "ping", text: "Latest Latency: " + irc.latencyStats.lastPing + " ms - Average over " + irc.latencyStats.numOfPings + " pings: " + (irc.latencyStats.totalPing / irc.latencyStats.numOfPings) + " ms", type: 'ping'});        
                    activeMessageList.add(message);
                }
                break;
                
            case '/list':
                irc.appView.notifyInfo("LIST requested", "Long running command, might halt other functions till completion");
                irc.socket.emit('list', {args: command.splice(1)}); //list takes [array of args]
                break;
                
            case '/backlog':
                if (command[1]) {
                    irc.socket.emit('getOldMessages', {channelName: irc.chatWindows.getActive().get('name'), skip:0, amount: command[1]});
                }
                else {
                    irc.socket.emit('getOldMessages', {channelName: irc.chatWindows.getActive().get('name'), skip:0, amount: 10});
                }
                break;
                
            case '/clear':
                irc.chatWindows.getActive().messageList.reset();
                break;
                
            default:
                irc.appView.notifyError('Invalid Command', command[0] + " is not a valid command");
                break;
        }
    }

});

