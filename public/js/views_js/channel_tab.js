var ChannelTabView = Backbone.View.extend({
    className: 'channel',
    tagName: 'li',

    events: {
        'click': 'setActive',
        'click .close-button': 'close'
    },

    initialize: function() {
        this.model.messageList.bind('add', this.updateUnreadCounts, this);
        this.model.bind('destroy', this.switchAndRemove, this);
        this.model.bind('change:active', this.removeUnread, this);
    },

    render: function() {
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
        console.log("setting active: ");
        console.log(this.model);
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
        if (this.model.get('active') === false) return;
        this.model.set({unread: 0, unreadHighlights: 0});
        this.updateUnreadCounts();
    },

    close: function(e) {
        e.stopPropagation();
        if (this.model.get('type') === 'channel') {
            irc.socket.emit('part', this.model.get('name'));
        }
        else {
            irc.socket.emit('part_pm', this.model.get('name'));
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
        nextTab.click();
    }

});
