var UserView = Backbone.View.extend({
    initialize: function(user) {
        this.user = user;
    },

    className: 'userlist_user',
    
    events : {
        'click .pmbutton' : 'handlePM',
        'click .whoisbutton' : 'handleWHOIS',
    },
    

    render: function() {
        this.$el.html(_.template($("#userlist_user").html(), (this.user.model.attributes)));
        return this;
    },
    
    handlePM: function() {
        //commandHandle takes arrays of it, split by spaces
        irc.commandHandle(["/query", this.user.model.attributes.nick]);
    }
    
    handleWHOIS: function() {
        irc.commandHandle(["/whois", this.user.model.attributes.nick]);
    }
    
});


var UserListView = Backbone.View.extend({
    initialize: function() {
        this.setElement(this.collection.channel.view.$('#user-list'));
        this.collection.bind('add', this.add, this); //When an element is added to the colleciton, handle adding the actual view (appending)
    },

    render: function() {
        return this;
    },

    add: function(User) {
        var userView = new UserView({model: User});
        User.view = userView;
        this.$el.append(userView.render().el);
    }
});
