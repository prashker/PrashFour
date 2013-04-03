var UserView = Backbone.View.extend({
    initialize: function(user) {
        this.user = user;
    },

    //Each User is of the class usersList_user
    className: 'user-in-list',
    
    events : {
        'click .pmbutton' : 'handlePM',
        'click .whoisbutton' : 'handleWHOIS',
        'click .pingbutton' : 'handlePING',
    },
    

    render: function() {
        //Take the template and populate it with the values of the users attributes
        //Responsible for the rendering on the page
        this.$el.html(_.template($("#userlist_user").html(), (this.user.model.attributes)));      
        return this;
    },
    
    rebindEvents: function() {
        //Used when returning to this tab
        //Backbone by default uses events but when we lose focus these delegations are lost, so we re-delegate to this.events;
        this.delegateEvents();
    },
    
    handlePM: function() {
        irc.commandHandle(["/query", this.user.model.attributes.nick]);
    },
    
    handleWHOIS: function() {
        irc.commandHandle(["/whois", this.user.model.attributes.nick]);
    },
    
    handlePING: function() {
        irc.commandHandle(["/ping", this.user.model.attributes.nick]);
    }
    
});


var UserListView = Backbone.View.extend({
    //Responsible for a LIST of Users (list of UserViews)

    initialize: function() {
        this.setElement(this.collection.channel.view.$('#user-list'));
        this.collection.bind('add', this.add, this); //When an element is added to the colleciton, handle adding the actual view (appending)
    },

    render: function() {
        return this;
    },

    add: function(User) {
        //Every time we add a user, create a UserView, and append it to the current list (visually)
        var userView = new UserView({model: User});
        User.view = userView;
        this.$el.append(userView.render().el);
    }
});
