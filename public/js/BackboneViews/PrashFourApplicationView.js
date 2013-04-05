var ChatApplicationView = Backbone.View.extend({
    className: 'backboneAllWrap',
    originalTitle: document.title,
    
    //Quick Nav Buttons (Helpful for Commands) - Auto appends to chat-input-box
    events: {
        'click #nav-quick-buttons button' : 'hintBoxButtonClick'
    },
    
    hintBoxButtonClick : function(e) {
        //Not irc.chatWindows.getActive().view.$('#chat-input')?
        $('#chat-input').val(e.currentTarget.innerText);
        $('#chat-input').focus();
    },


    initialize: function() {
        //Bind the events of unread messages and highlights to the view updating methods
        irc.chatWindows.bind('change:unread', this.showUnread, this);
        irc.chatWindows.bind('change:unreadHighlights', this.showUnread, this);
        this.render();
    },

    render: function() {
        //This is the main thing so it primarily replaces BODY with #main (which is our application interface wrapper class)
    
        $('body').html(this.$el.html(_.template($("#main").html())));
        
        
        //If we're not connected, show the normal Welcome MainView
        if (!irc.connected) {
            this.mainview = new MainView();
        } 
        else {
            this.channelList = new ChannelListView();
        }
        
        this.delegateEvents(); //Uses this.events
        
        return this;
    },

    renderUserBox: function() {
        //The userbox is the top navigation, which contains the hint buttons along with the server you're connected to, along with the list of channels
        $('#user-box').html(_.template($("#user_box").html(),irc.me.toJSON()));

        // disconnect server handler
        // custom disconnect button beside the server information
        $('#user-box .close-button').click(function() {
            irc.socket.emit('disconnectServer');
        });
    },
    
    // Net connection error
    notifyError: function(title, text) {
        $.pnotify({
            title: title,
            text: text,
            type: 'error',
            animation: 'fade'
        });
    },
    
    notifySuccess: function(title, text) {
        $.pnotify({
            title: title,
            text: text,
            type: 'success',
            animation: 'fade'
        });
    },
    
    notifyInfo: function(title, text) {
        $.pnotify({
            title: title,
            text: text,
            type: 'info',
            animation: 'fade'
        });
    },

    // Show number of unread highlights in title
    showUnread: function() {
        //Some titlebar of browser logic, if we have more than 0 unread messages, update the titlebar
        var unreadCount = irc.chatWindows.unreadCount();
        if (unreadCount > 0) {
            document.title = '(' + unreadCount + ') ' + this.originalTitle;
        }
        else {
            document.title = this.originalTitle;
        }
    },

});
