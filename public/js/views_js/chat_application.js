var ChatApplicationView = Backbone.View.extend({
    className: 'backboneAllWrap',
    originalTitle: document.title,
    
    events: {
        'click #nav-quick-buttons button' : 'hintBoxButtonClick'
    },
    
    hintBoxButtonClick : function(e) {
        $('#chat-input').val(e.currentTarget.innerText);
        $('#chat-input').focus();
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

    renderUserBox: function() {
        $('#user-box').html(_.template($("#user_box").html(),irc.me.toJSON()));

        // disconnect server handler
        $('#user-box .close-button').click(function() {
            irc.socket.emit('disconnectServer');
        });
    },
    
    // Net connection error
    notifyError: function(title, text) {
        $.pnotify({
            title: title,
            text: text,
            type: 'error'
        });
    },
    
    notifySuccess: function(title, text) {
        $.pnotify({
            title: title,
            text: text,
            type: 'success'
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
