var ChannelTabView = Backbone.View.extend({
    //Every channel tag is a li.channel (to conform with bootstraps list format)
    className: 'channel',
    tagName: 'li',

    //When we click one, or the close button, do their events
    events: {
        'click': 'setActive',
        'click .close-button': 'close' //made visible via CSS
    },

    initialize: function() {
        //When a message is added to the messageList, this is responsible for retrieving the information about unread things and potentially updating the view
        this.model.messageList.bind('add', this.updateUnreadCounts, this);
        
        //If we close this, switch to another tab
        this.model.bind('destroy', this.switchAndRemove, this);
        
        //If this is now active, remove all unread stuff
        this.model.bind('change:active', this.removeUnread, this);
    },

    render: function() {
        //The first render, getting #channel and populating it with the fields
        var self = this;
        var tmpl = _.template($("#channel").html(), {
            name: this.model.get('name'),
            unread: (this.model.get('unread') == 0 ? '' : this.model.get('unread')), //Make it blank if 0, brand is hidden if ''
            unreadHighlights: (this.model.get('unreadHighlights') == 0 ? '' : this.model.get('unreadHighlights')) //Make it blank if 0, brand is hidden if ''
        });
        this.$el.html(tmpl);
        return this;
    },

    setActive: function() {
        if (!this.model.get('active')) {
            irc.chatWindows.setActive(this.model);
        }
        //Thought bootstrap would take care of this, but...
        //Cascading functionality to add "active" to the one we just clicked, and deactivate the others (which if everything goes good, should be just one)
        this.$el.addClass('active').siblings().removeClass('active');
        //Remove the unread messages now that we are able to see the messages
        this.removeUnread();
    },

    updateUnreadCounts: function(msg) {
        var unread = this.model.get('unread');
        var unreadHighlights = this.model.get('unreadHighlights');

        this.$('.unread').text(unread == 0 ? '' : unread);
        this.$('.unread-highlights').text(unreadHighlights == 0 ? '' : unreadHighlights);
    },

    removeUnread: function() {
        if (this.model.get('active') === false) 
            return;
        this.model.set({unread: 0, unreadHighlights: 0});
        this.updateUnreadCounts();
    },

    close: function() {
        if (this.model.get('type') === 'channel') {
            //Notify the server that we will be parting
            irc.socket.emit('part', this.model.get('name'));
        }
        this.model.destroy();
    },

    switchAndRemove: function() {
        var nextTab;
        // Focus on next frame if this one has the focus
        if (this.$el.hasClass('active')) {
            // Go to previous frame unless it's status
            if (this.$el.next().length) {
                nextTab = this.$el.next();
            } else {
                nextTab = this.$el.prev();
            }
        }
        this.remove();
        nextTab.click(); //triggers setActive elsewhere
    }

});
