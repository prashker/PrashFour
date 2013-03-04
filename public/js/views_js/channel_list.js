var ChannelListView = Backbone.View.extend({
    el: '#channels',

    initialize: function() {
        irc.chatWindows.bind('add', this.addChannel, this);
        this.channelTabs = []; //Could have a model like the others, but meh...
    },

    addChannel: function(chatWindow) {
        var view = new ChannelTabView({model: chatWindow});
        this.channelTabs.push(view);
        this.$el.append(view.render().el);

        var name = chatWindow.get('name');
        var type = chatWindow.get('type');
        if (name[0] === '#' || name === 'status' || type === 'pm') {
            view.setActive();
        }
    }
  
});
