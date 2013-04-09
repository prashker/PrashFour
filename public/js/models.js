var Message = Backbone.Model.extend({
    defaults: {
        type: 'message',
        text: ''
    },

    initialize: function() {
        //Check if the message contains our nickname
        //Applies to any message
        if (this.get('text').search('\\b' + irc.me.get('nick') + '\\b') !== -1) {
            this.set({highlight: true});
        }
    },

    parse: function(text) {
        //Parse the text someone sends (url + emoticon)
        var result = irc.unifiedReplace(text);
        //If the sender is NOT me, check also for highlights and replace those as bolded instances of my name
        if (this.get('sender') !== irc.me.get('nick')) {
            result = irc.highlightReplace(result);
        }
        return result;
    },
});


// Represents any window
var ChatWindow = Backbone.Model.extend({
    defaults: {
        type: 'channel',
        active: true,
        unread: 0,
        unreadHighlights: 0
    },

    initialize: function() {
        //Create the message list associated with the chat window
        this.messageList = new MessageList();
        
        //When a message is added, keep the information about if it was unread or not updated
        this.messageList.bind('add', this.setUnread, this);
        
        //Allow to get back to channel model information via messageList
        this.messageList.channel = this;
        
        //Setup the view
        this.view = new ChatView({model: this});
    },

    part: function() {
        this.destroy();
    },

    setUnread: function(msg) {
        if (this.get('active')) {
            //It isn't unread if it is the active window
            return;
        }
        
        // Increment unread messages
        if (msg.get('type') === 'message' || msg.get('type') === 'pm') {
            this.set({unread: this.get('unread') + 1});
        }
        
        //Increment unread highlights
        if (msg.get('highlight')) {
              this.set({unreadHighlights: this.get('unreadHighlights') + 1});
        }
    }
});

var User = Backbone.Model.extend({
    defaults: {
        nick: '',
        prefix: ''
    },
    
    initialize: function() {
        //Nothing to do, just a simple model of name and OP status
    }
});
