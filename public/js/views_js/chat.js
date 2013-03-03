var ChatView = Backbone.View.extend({
    initialize: function() {
        //because setElement needs an HTMLElement rather than HTML text like every other part, do this
        //the trim() is because jQuery doesn't like ' <div>' but instead '<div>'
        this.setElement(_.template($("#chat").html(), {}).trim());
        var name = this.model.get('name');

        //When the model's topic changes, bind to the update title of the view
        this.model.bind('change:topic', this.updateTitle, this);
        //Same with adding a message
        this.model.stream.bind('add', this.addMessage, this);
    },

    updateTitle: function(channel) {
        var topic = this.model.get('topic') || '';
        var context = {
            title: this.model.get('name'),
            topic: utils.linkify(topic)
        };
        this.$('#chat-bar').html(_.template($("#titlebar").html(), context));
    },

    render: function() {
        $('.content').html(this.el);
        $('#chat-contents').scrollTop(
            $('#chat-contents')[0].scrollHeight - $('#chat-contents').height()
        );
        this.updateTitle();
        this.handleInput();
        $('#chat-input').focus();
        return this;
    },

    handleInput: function() {
        $('#chat-button').click( function(){
            var message = $('#chat-input').val();
                if (message.substr(0, 1) === '/') {
                    var command = message.split(' ');
                    irc.commandHandle(command);
                } 
                else {
                    irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
                }
            $('#chat-input').val('');
        });
     
        $('#chat-input').bind({
            // Enable button if there's any input
            change: function() {
                if ($(this).val().length) {
                    $('#chat-button').removeClass('disabled');
                } 
                else {
                    $('#chat-button').addClass('disabled');
                }
            },

            keydown: function(event) {
                if ($(this).val().length) {
                    if (event.keyCode === 13) {
                        var message = $(this).val();
                        // Handle IRC commands
                        if (message.substr(0, 1) === '/') {
                            var command = message.split(' ');
                            irc.commandHandle(command);
                        } 
                        else {
                            // Send the message
                            irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
                        }
                        $(this).val('');
                        $('#chat-button').addClass('disabled');
                    }
                    else {
                        $('#chat-button').removeClass('disabled');
                    }
                } 
                else {
                    $('#chat-button').addClass('disabled');
                }
            }
        });
    },

    addMessage: function(msg) {
        var $chatWindow = this.$('#chat-contents');
        var view = new MessageView({model: msg});
        var sender = msg.get('sender');
        var type = msg.get('type');

        var nicksToIgnore = ['', 'notice', 'status'];

        if (nicksToIgnore.indexOf(sender) === -1 && type === 'message'){
            var user = this.model.userList.getByNick(sender);
            var element = $(user.view.el);
            element.prependTo(element.parent());
        }

        $chatWindow.append(view.el);

        if (sender === irc.me.get('nick') && ['message', 'pm'].indexOf(type) !== -1) {
            $(view.el).addClass('message-me');
        }

        if (['join', 'part', 'topic', 'nick', 'quit'].indexOf(type) !== -1) {
            $(view.el).addClass('message_notification');
        }

        // Scroll down to show new message
        var chatWindowHeight = ($chatWindow[0].scrollHeight - $chatWindow.height());
        // If the window is large enough to be scrollable
        if (chatWindowHeight > 0) {
            // If the user isn't scrolling go to the bottom message
            if ((chatWindowHeight - $chatWindow.scrollTop()) < 200) {
                $('#chat-contents').scrollTo(view.el, 200);
            }
        }
    },
});
