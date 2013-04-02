var ChannelListView = Backbone.View.extend({
    el: '#channels',

    initialize: function() {
        irc.chatWindows.bind('add', this.addChannel, this);
        this.channelTabs = [];
    },

    addChannel: function(chatWindow) {
        var view = new ChannelTabView({model: chatWindow});
        this.channelTabs.push(view);
        this.$el.append(view.render().el);

        var name = chatWindow.get('name');
        var type = chatWindow.get('type');
        //basically set any new window as active that isn't LIST or a PM (aka the two "unrequested" windows)
        if (type !== 'pm') {
            view.setActive();
        }
    }
  
});
