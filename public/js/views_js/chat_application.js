var ChatApplicationView = Backbone.View.extend({
    className: 'container-fluid',
    originalTitle: document.title,
    
    events: {
        'click #hint-box button' : 'hintBoxButtonClick'
    },
    
    hintBoxButtonClick : function() {
        console.log("A help-text button was clicked");
    },


    initialize: function() {
        irc.chatWindows.bind('change:unread', this.showUnread, this);
        irc.chatWindows.bind('change:unreadHighlights', this.showUnread, this);
        this.render();
    },

    render: function() {
        $('body').html(this.$el.html(_.template($("#main").html())));
        
        if (!irc.connected) {
            this.mainview = new MainView;
        } 
        else {
            this.channelList = new ChannelListView;
        }
        
        this.delegateEvents(); //Uses this.events
        
        return this;
    },

    // Net connection error
    showError: function(text) {
        $('#loading_image').remove();
        $('.btn').removeClass('disabled');
        $('#home_parent').after(_.template($("#alert").html(),{
            type: 'alert-error',
            content: text
        }));
    },

    renderUserBox: function() {
        $('#user-box').html(_.template($("#user_box").html(),irc.me.toJSON()));

        // disconnect server handler
        $('#user-box .close-button').click(function() {
            irc.socket.emit('disconnectServer');
        });
    },

    // Show number of unread highlights in title
    showUnread: function() {
        var unreads = irc.chatWindows.unreadCount();
        if (unreads > 0)
            document.title = '(' + unreads + ') ' + this.originalTitle;
        else
            document.title = this.originalTitle;
    },

});
