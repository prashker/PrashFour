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
            topic: utils.unifiedReplace(topic)
        };
        this.$('#chat-bar').html(_.template($("#titlebar").html(), context));
    },

    render: function() {
        $('.content').html(this.el);
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

    addMessage: function(msg) {
        var $chatWindow = this.$('#chat-contents');
        var view = new MessageView({model: msg});
        var sender = msg.get('sender');
        var type = msg.get('type');

        $chatWindow.append(view.el);

        //If me and message or PM add message-me
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
            // (If the user is at/near the bottom, auto-scroll)
            if ((chatWindowHeight - $chatWindow.scrollTop()) < 200) {
                $('#chat-contents').scrollTo(view.el, 200);
            }
        }
    },
});
