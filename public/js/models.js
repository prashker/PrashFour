var Message = Backbone.Model.extend({
    defaults: {
    // expected properties:
    // - sender
    // - raw
        type: 'message'
    },

    initialize: function() {
        if (this.get('raw')) {
            this.set({text: this.get('raw')});
        }

        //highlightCheck was moved out of models.js to utils.js, this is a highlight fix
        //check if nick is present in RAW
        if (this.get('type') === 'message' && this.get('raw').search('\\b' + irc.me.get('nick') + '\\b') !== -1) {
            this.set({highlight: true});
        }
    },

    parse: function(text) {
        var nick = this.get('sender') || this.collection.channel.get('name');
        var result = utils.unifiedReplace(text);
        if (nick !== irc.me.get('nick')) {
            result = utils.highlightCheck(result);
        }
        return result;
    },
});


// Represents any window
var ChatWindow = Backbone.Model.extend({
    // expected properties:
    // - name
    defaults: {
        type: 'channel',
        active: true,
        unread: 0,
        unreadHighlights: 0
    },

    initialize: function() {
        this.stream = new Stream();
        this.stream.bind('add', this.setUnread, this);
        this.stream.channel = this;
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
        if (this.get('type') === 'pm') { 
            //PM Handler
        }
        if (msg.get('highlight')) {
              this.set({unreadHighlights: this.get('unreadHighlights') + 1});
        }
    }
});

var User = Backbone.Model.extend({
    initialize: function() {
        
    },

    defaults: {
        nick: "",
        prefix: ""
    }
});
