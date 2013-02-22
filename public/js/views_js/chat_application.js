var ChatApplicationView = Backbone.View.extend({
  className: 'container-fluid',
  originalTitle: document.title,

    initialize: function() {
        irc.chatWindows.bind('change:unread', this.showUnread, this).bind('change:unreadHighlights', this.showUnread, this)

        // Detect window focus so new message alerts come in
        // when window is not focused, even on current tab
        var blurTimer, activeChat;
        $(window).blur(function() {
            blurTimer = setTimeout(function() {
                // Only assign if there's currently an active window
                // Guards against losing activeChat if there's a second blur event
                activeChat = irc.chatWindows.getActive() ? irc.chatWindows.getActive() : activeChat;
                if (activeChat && activeChat.set) { 
                    activeChat.set('active', false); 
                }
          }, 1000);
        }).focus(function() {
            clearTimeout(blurTimer);
            if(activeChat && activeChat.set) { 
                activeChat.set('active', true); 
            }
        });

        this.render();
    },

    render: function() {
        $('body').html($(this.el).html(_.template($("#main_application").html())));
        if (!irc.connected) {
            this.mainview = new MainView;
        } 
        else {
            this.channelList = new ChannelListView;
            $('.slide').css('display', 'inline-block');
        }
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
