var ChannelListView = Backbone.View.extend({
    el: '#channels',

    initialize: function() {
        irc.chatWindows.bind('add', this.addChannel, this);
        this.channelTabs = []; //Could have a model like the others, but meh...
    },

    addChannel: function(chatWindow) {
        var $el = $(this.el);
        var view = new ChannelTabView({model: chatWindow});
        this.channelTabs.push(view);
        $el.append(view.render().el);

        var name = chatWindow.get('name');
        if (name[0] === '#' || name === 'status') {
            view.setActive();
        }
    }
  
});
