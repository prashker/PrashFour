var ChatView = Backbone.View.extend({
    initialize: function() {
        //because setElement needs an HTMLElement rather than HTML text like every other part, do this
        //the trim() is because jQuery doesn't like ' <div>' but instead '<div>'
        this.setElement(_.template($("#chat").html(), {}).trim());
        var name = this.model.get('name');

        //When the model's topic changes, bind to the update title of the view
        this.model.bind('change:topic', this.updateTitle, this);
        //Same with adding a message
        this.model.messageList.bind('add', this.addMessage, this);
    },

    updateTitle: function(channel) {
        var topic = this.model.get('topic') || '';
        var context = {
            title: this.model.get('name'),
            topic: irc.unifiedReplace(topic)
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
        var that = this;
        
        //Typeahead for Nicks
        //http://stackoverflow.com/questions/12272680/jquery-bootstrap-updating-a-typeahead-after-events-removed-from-input
        $('#chat-input').off();
        $('#chat-input').data('typeahead', (data = null));
        $('#chat-input').typeahead({
            //first result in array is undefined, skip it
            source: (irc.chatWindows.getActive().userList ? _.rest(_.toArray(irc.chatWindows.getActive().userList.getUsersNameArray()), 1) : []),
            
            matcher: function (item) {
                if (item.toLowerCase().indexOf(this.query.toLowerCase()) == 0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        });
        
        $('#chat-button').click( function(){
            that.handleMessage();
        });
     
        $('#chat-input').bind({
            keydown: function(event) {
                if (event.keyCode === 13) {
                    that.handleMessage();
                }
            }
        });
        

    },
    
    handleMessage: function () {
        var message = $('#chat-input').val();
        if (message.length) {
            if (message.substr(0, 1) === '/') {
                var command = message.split(' ');
                irc.commandHandle(command);
            } 
            else {
                irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            $('#chat-input').val('');
        }
    },

    addMessage: function(message) {
        var chatWindow = this.$('#chat-contents'); //sneaky bug
        var view = new MessageView({model: message});
        var sender = message.get('sender');
        var type = message.get('type');

        chatWindow.append(view.el);

        //If me and message or PM add message-me
        if (sender === irc.me.get('nick') && ['message', 'pm'].indexOf(type) !== -1) {
            $(view.el).addClass('message-me');
        }

        if (['join', 'part', 'topic', 'nick', 'quit'].indexOf(type) !== -1) {
            $(view.el).addClass('message-notification');
        }

        //As the TA mentioned - now scrolling done on new message
        // Scroll down to show new message
        var chatWindowHeight = (chatWindow[0].scrollHeight - chatWindow.height());
        // If the window is large enough to be scrollable
        if (chatWindowHeight > 0) {
            // If the user isn't scrolling go to the bottom message
            if ((chatWindowHeight - chatWindow.scrollTop()) < 250) {
                $('#chat-contents').scrollTo(view.el, 250);
            }
        }
    },
});
