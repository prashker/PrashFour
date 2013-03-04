var ChannelTabView = Backbone.View.extend({
    className: 'channel',

    events: {
        'click': 'setActive',
        'click .close-button': 'close'
    },

    initialize: function() {
        this.model.stream.bind('add', this.updateUnreadCounts, this);
        this.model.bind('destroy', this.switchAndRemove, this);
        this.model.bind('change:active', this.removeUnread, this);
    },

    render: function() {
        var self = this;
        var tmpl = _.template($("#channel").html(), {
            name: this.model.get('name'),
            notStatus: function() {
                return self.model.get('type') !== 'status';
            },
            unread: (this.model.get('unread') == 0 ? '' : this.model.get('unread')), //Make it blank if 0, brand is hidden if ''
            unreadHighlights: (this.model.get('unreadHighlights') == 0 ? '' : this.model.get('unreadHighlights')) //Make it blank if 0, brand is hidden if ''
        });
        this.$el.html(tmpl);
        return this;
    },

    setActive: function() {
        if (!this.model.get('active')) irc.chatWindows.setActive(this.model);
        this.$el.addClass('active').siblings().removeClass('active');
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
        var $nextTab;
        // Focus on next frame if this one has the focus
        if (this.$el.hasClass('active')) {
            // Go to previous frame unless it's status
            if (this.$el.next().length) {
                $nextTab = this.$el.next();
            } else {
                $nextTab = this.$el.prev();
            }
        }
        this.remove();
        if (typeof($nextTab.click) == 'function') {
            $nextTab.click();
        }
    }

});
