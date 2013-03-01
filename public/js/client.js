//= require 'libs/socket.io.js'
//= require 'libs/jquery-1.9.1.min.js'
//= require 'libs/jquery.scrollTo-1.4.2-min.js'
//= require 'libs/underscore-min.js'
//= require 'libs/backbone-min.js'
//= require 'libs/bootstrap.min.js'
//= require 'libs/moment.min.js'
//= require 'utils.js'
//= require 'models.js'
//= require 'collections.js'
//= require_tree 'views_js'


window.irc = {
    socket: io.connect(null, {port: PORT}),
    chatWindows: new WindowList(),
    connected: false,
    loggedIn: false
};

//The main running block, handles all the events the server sends our way

$(function() {
    irc.appView = new ChatApplicationView();


    //https://groups.google.com/forum/?fromgroups=#!searchin/socket_io/latency/socket_io/66oeLfcq_1I/Hv2D6U0F5qAJ
    setInterval(function() {
        emitTime = Date.now();
        irc.socket.emit('latencyPING', {});
    }, 3000);
    irc.socket.on('latencyPONG', function() {
        console.log('Latency (round-trip time): ' + (Date.now() - emitTime) + 'ms');
    });    

    irc.socket.emit('getDatabaseState', {});
    irc.socket.on('databaseState', function(data) {
        if(data.state === 0){
            $('#login, #register').hide();
        }
    });

    // Registration (server joined)
    irc.socket.on('registered', function(data) {
        var window = irc.chatWindows.getByName('status');
        irc.socket.emit('getNick', {});
        irc.connected = true;
        if (window === undefined) {
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
        } else {
            irc.appView.renderUserBox();
        }

        // Will reflect modified nick, if chosen nick was taken already
        irc.me.set('nick', data.message.args[0]);
    });

    irc.socket.on('login_success', function(data) {
        window.irc.loggedIn = true;
        if(data.exists){
            irc.socket.emit('connect', {});
        } else {
            irc.appView.mainview.render({currentTarget: {id: "connection"}});
        }
    });

    irc.socket.on('disconnect', function() {
        alert('You were disconnected from the server.');
        $('.container-fluid').css('opacity', '0.5');
    });


    irc.socket.on('register_success', function(data) {
        window.irc.loggedIn = true;
        irc.appView.mainview.render({currentTarget: {id: "connection"}});
    });

    irc.socket.on('restore_connection', function(data) {
        irc.me = new User({nick: data.nick, server: data.server});
        irc.connected = true;
        irc.appView.render();
        irc.appView.renderUserBox();
        irc.chatWindows.add({name: 'status', type: 'status'});
        $.each(data.channels, function(key, value) {
            var chanName = value.serverName.toLowerCase();
            if (chanName[0] == '#') {
                irc.chatWindows.add({name: chanName, initial: true});
            } 
            else {
                irc.chatWindows.add({name: chanName, type: 'pm', initial: true});
            }
            
            var channel = irc.chatWindows.getByName(chanName);
            var channelTabs = irc.appView.channelList.channelTabs;
            var channelTab = channelTabs[channelTabs.length-1];
            channel.set({
                topic: value.topic,
                unread: 0,
                unreadHighlights: 0
            });
            
            channelTab.updateUnreadCounts();
            if (chanName[0] == '#') {
                channel.userList = new UserList(channel);
                $.each(value.users, function(user, role) {
                    channel.userList.add({nick: user, role: role});
                });
                irc.socket.emit('getOldMessages',{channelName: chanName, skip:0, amount: 50});
            } 
            else {
                irc.socket.emit('getOldMessages',{channelName: chanName, skip:0, amount: 50});
                channel.stream.add(new Message({sender:'', raw:''}));
            }
        });

        $('.channel:first').click();
    });

    irc.socket.on('notice', function(data) {
        var status = irc.chatWindows.getByName('status');
        if (status === undefined) {
            irc.connected = true;
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
            status = irc.chatWindows.getByName('status');
        }
        var sender = (data.nick !== undefined) ? data.nick : 'notice';
        status.stream.add({sender: sender, raw: data.text, type: 'notice'});
    });

    // Message of the Day
    irc.socket.on('motd', function(data) {
        var message = new Message({sender: 'status', raw: data.motd, type: 'motd'});
        irc.chatWindows.getByName('status').stream.add(message);
    });

    irc.socket.on('message', function(data) {
        var chatWindow = irc.chatWindows.getByName(data.to.toLowerCase());
        var type = 'message';
        // Only handle channel messages here; PMs handled separately
        if (data.to.substr(0, 1) === '#') {
            chatWindow.stream.add({sender: data.from, raw: data.text, type: type});
        } else if(data.to !== irc.me.get('nick')) {
            // Handle PMs intiated by me
            chatWindow.stream.add({sender: data.from.toLowerCase(), raw: data.text, type: 'pm'});
        }
    });
    
    //Bug Fix Issue ACTION (WORKAROUND)
    irc.socket.on('action', function(data) {
        var chatWindow = irc.chatWindows.getByName(data.to.toLowerCase());
        var type = 'message';
        if (data.to.substr(0, 1) === '#') {
            chatWindow.stream.add({sender: data.from, raw: ' ACTION ' + data.text, type: type});
        } else if(data.to !== irc.me.get('nick')) {
            chatWindow.stream.add({sender: data.from.toLowerCase(), raw: ' ACTION ' + data.text, type: 'pm'});
        }
    });

    irc.socket.on('pm', function(data) {
        var chatWindow = irc.chatWindows.getByName(data.nick.toLowerCase());
        if (typeof chatWindow === 'undefined') {
            irc.chatWindows.add({name: data.nick.toLowerCase(), type: 'pm'}).trigger('forMe', 'newPm');
            irc.socket.emit('getOldMessages',{channelName: data.nick.toLowerCase(), skip:0, amount: 50});
            chatWindow = irc.chatWindows.getByName(data.nick.toLowerCase());
        }
        chatWindow.stream.add({sender: data.nick, raw: data.text, type: 'pm'});
    });

    irc.socket.on('join', function(data) {
        var chanName = data.channel.toLowerCase();
        if (data.nick === irc.me.get('nick')) {
            irc.chatWindows.add({name: chanName});
            irc.socket.emit('getOldMessages',{channelName: chanName, skip:0, amount: 50});
        } 
        else {
            var channel = irc.chatWindows.getByName(chanName);
            if (typeof channel === 'undefined') {
                irc.chatWindows.add({name: chanName});
                channel = irc.chatWindows.getByName(chanName);
            }
            channel.userList.add({nick: data.nick, role: data.role});
            var joinMessage = new Message({type: 'join', nick: data.nick});
            channel.stream.add(joinMessage);
        }
    });

    irc.socket.on('part', function(data) {
        var chanName = data.channel.toLowerCase();
        var channel = irc.chatWindows.getByName(chanName);
        if (data.nick === irc.me.get('nick')) {
            channel.part();
        } 
        else {
            var user = channel.userList.getByNick(data.nick);
            user.view.remove();
            user.destroy();
            var partMessage = new Message({type: 'part', nick: data.nick});
            channel.stream.add(partMessage);
        }
    });

    irc.socket.on('quit', function(data) {
        var channel, user, quitMessage;
        for(var i=0; i<data.channels.length; i++){
            channel = irc.chatWindows.getByName(data.channels[i]);
            if(channel !== undefined) {
                user = channel.userList.getByNick(data.nick);
                user.view.remove();
                user.destroy();
                quitMessage = new Message({type: 'quit', nick: data.nick, reason: data.reason, message: data.message});
                channel.stream.add(quitMessage);
            }
        }
    });

    irc.socket.on('names', function(data) {
        var channel = irc.chatWindows.getByName(data.channel.toLowerCase());
        channel.userList = new UserList(channel);
        $.each(data.nicks, function(nick, role) {
            channel.userList.add(new User({nick: nick, role: role}));
        });
    });

    irc.socket.on('nick', function(data) {
        if (data.oldNick === irc.me.get('nick'))
            irc.me.set('nick', data.newNick);

        var channel = irc.chatWindows.getByName(data.channels[0]);
        var user = channel.userList.getByNick(data.oldNick);
        user.set({nick: data.newNick});
        user.view.render();

        // Add nickmessage to all channels
        var nickMessage = new Message({type: 'nick', oldNick: data.oldNick, newNick: data.newNick});
        for( var i in data.channels ) {
            channel = irc.chatWindows.getByName(data.channels[i]);
            channel.stream.add(nickMessage);
        }
        
    });

    irc.socket.on('topic', function(data) {
        var channel = irc.chatWindows.getByName(data.channel.toLowerCase());
        channel.set({topic: data.topic});
        var topicMessage = new Message({type: 'topic', nick: data.nick, topic: utils.linkify(data.topic)});
        channel.stream.add(topicMessage);
    });

    irc.socket.on('error', function(data) {
        var window = irc.chatWindows.getByName('status');
        if(window === undefined){
            irc.connected = true;
            irc.appView.render();
            irc.chatWindows.add({name: 'status', type: 'status'});
            window = irc.chatWindows.getByName('status');
        }
        window.stream.add({sender: 'error', raw: data.message.args.join(), type: 'notice'});
    });

    irc.socket.on('netError', function(data) {
        irc.appView.showError('Invalid server');
    });

    irc.socket.on('login_error', function(data) {
        irc.appView.showError(data.message);
    });

    irc.socket.on('register_error', function(data) {
        irc.appView.showError(data.message);
    });

    irc.socket.on('reset', function(data) {
        irc.chatWindows = new WindowList();
        irc.connected = false;
        irc.loggedIn = false;
        irc.me = null;

        // move to main view
        irc.appView.render();

        // remove login and register button if no database
        irc.socket.emit('getDatabaseState', {});
    });

    irc.socket.on('oldMessages', function(data){
        var output = '';
        channel = irc.chatWindows.getByName(data.name);

        if (data.messages) {
            $.each(data.messages.reverse(), function(index, message){                
                if($('#' + message._id).length) {
                    return true; //continue to next iteration
                }

                var type = '';
                var message_html;
                if (message.message.substr(1, 6) === 'ACTION') {
                    message_html = _.template($("#action-message").html(), {
                        user: message.user,
                        content: message.message.substr(8),
                        timeStamp: moment(message.date).format('ddd MMM D YYYY, h:mmA'),
                        type: 'backlog'
                    });
                } 
                else {
                    message_html = _.template($("#message").html(), {
                        user: message.user,
                        content: message.message,
                        timeStamp: moment(message.date).format('ddd MMM D YYYY, h:mmA'),
                        type: 'backlog'
                    });
                }


                if(message.user == irc.me.get('nick')){
                    type = 'message-me';
                } else {
                    message_html = utils.highlightCheck(message_html);
                }
                
            

                message_html = utils.linkify(message_html);
                message_html = '<div class="message-box ' + type + '">' + message_html + '</div>';
                output += message_html;
            });
        }
        
        channel.view.$('#chat-contents').prepend(output);

    });



    //Constructor Invocation Pattern (AHHHH GET OUT MY HEAD)
    irc.commands = (function(){
        var commandStore = {
        
        };

        that = {
            add: function(name, handler) {
                commandStore[name] = {
                  handler: handler,
                };
            },

            handle: function(args){
                var command = args[0];
                var handler = commandStore[command] && commandStore[command].handler;

                args.splice(0, 1);

                if (typeof(handler) === 'function'){
                  handler(args, command);
                }
            }
        };

        return that;
    }());

    irc.commands.add('join', function(args){
        irc.socket.emit('join', args[0]);
    });

    irc.commands.add('part', function(args) {
        if (args[0]) {
          irc.socket.emit('part', args[0]);
          irc.appView.channelList.channelTabs[0].setActive();
        } else {
          irc.socket.emit('part', irc.chatWindows.getActive().get('name'));
          irc.appView.channelList.channelTabs[0].setActive();
        }
    });

    irc.commands.add('nick', function(args){
        if (args[0]) {
            irc.socket.emit('nick', {nick : args[0]});
        }
    });

    irc.commands.add('topic', function(args){
        // If args[0] starts with # or &, a topic name has been provided
        if (args[0].indexOf('#') === 0 || args[0].indexOf('&') === 0) {
            irc.socket.emit('topic', {name: args.shift(), topic: args.join(' ')});
        } else { // Otherwise, assume we're changing the current channel's topic
            irc.socket.emit('topic', {
                name: irc.chatWindows.getActive().get('name'), 
                topic: args.join(' ')
            });
        }
    });

    irc.commands.add('me', function(args){
        irc.socket.emit('action', {
            target: irc.chatWindows.getActive().get('name'),
            message: args.join(" ")
        });
    });

    irc.commands.add('query', function(args){
        var target = args[0].toLowerCase();
        var myNick = irc.me.get('nick');
        if (typeof irc.chatWindows.getByName(target) === 'undefined') {
            irc.chatWindows.add({name: target, type: 'pm'});
        }
        irc.socket.emit('getOldMessages', {channelName: target, skip:0, amount: 50});
        irc.socket.emit('say', {
            target: target,
            message: args.splice(1).join(" ")
        });
    });

});

