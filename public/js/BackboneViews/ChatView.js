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
        //And when we delete all
        this.model.messageList.bind('reset', this.clearAllMessages, this);
    },

    updateTitle: function() {
        //Responsible for updating the topic titlebar once it changes
        //Unified replace parses the emoticons and URLs
        var topic = this.model.get('topic') || '';
        this.$('#chat-bar').html(_.template($("#titlebar").html(), {title: this.model.get('name'), topic: irc.unifiedReplace(topic)}));
    },

    render: function() {
        //Replace .content with this chatview
        $('.content').html(this.el);
        
        //Update the title with the topic
        this.updateTitle();
        
        //Scroll to the bottom of the window on render (on switch to this window)
        this.$('#chat-contents').scrollTop(
            this.$('#chat-contents')[0].scrollHeight - this.$('#chat-contents').height()
        );
        
        //Bind the chatbox to the events
        this.handleInput();
        
        //Set the chat box as active everytime
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
        
        //If we clicked the button, handle the message
        $('#chat-button').click( function(){
            that.handleMessage();
        });
     
        //If we pressed enter on the box, handle the message
        $('#chat-input').bind({
            keydown: function(event) {
                if (event.keyCode === 13) {
                    that.handleMessage();
                }
            }
        });
        

    },
    
    handleMessage: function () {
        //A super important block
        //If there is text in the chat-box, start processing
        var message = this.$('#chat-input').val();
        if (message.length) {
            //If it is a command, pass it to the command handler
            if (message.substr(0, 1) === '/') {
                //Split the command into an array of delimited words
                var command = message.split(' ');
                irc.commandHandle(command);
            } 
            else {
                irc.socket.emit('say', {target: irc.chatWindows.getActive().get('name'), message:message});
            }
            this.$('#chat-input').val('');
        }
    },

    addMessage: function(message) {
        //Responsible for adding a message to the window
        var chatWindow = this.$('#chat-contents');
        var view = new MessageView({model: message});
        var sender = message.get('sender');
        var type = message.get('type');

        //Simply append the message but...
        chatWindow.append(view.el);

        //Style my own messages different
        if (sender === irc.me.get('nick') && ['message', 'pm'].indexOf(type) !== -1) {
            $(view.el).addClass('message-me');
        }

        //Style notifications differently
        if (['join', 'part', 'topic', 'nick', 'quit'].indexOf(type) !== -1) {
            $(view.el).addClass('message-notification');
        }

        //As the TA mentioned - now scrolling done on new message
        // Scroll down to show new message
        var chatWindowHeight = (chatWindow[0].scrollHeight - chatWindow.height());
        // If the window is large enough to be scrollable
        if (chatWindowHeight > 0) {
            // If the user isn't scrolling go to the bottom message
            // Aka if the user is not within 250 of the bottom of the page, we assume they are reading a backlog and do not want auto-scroll (similar to how mIRC does it, but they probably do it on a line threshold)
            if ((chatWindowHeight - chatWindow.scrollTop()) < 250) {
                //Duration of scroll for a nice effect
                $('#chat-contents').scrollTo(view.el, 300);
            }
        }
    },
    
    clearAllMessages: function() {
        //Useful with the /clear command, clears it all
        this.$('#chat-contents').empty();
    }
    
});
