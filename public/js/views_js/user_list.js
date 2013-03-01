var UserView = Backbone.View.extend({
    initialize: function(user) {
        this.user = user;
    },

    className: 'userlist_user',

    render: function() {
        $(this.el).html(_.template($("#userlist_user").html(), (this.user.model.attributes)));
        return this;
    },

});


var UserListView = Backbone.View.extend({
    initialize: function() {
        this.setElement(this.collection.channel.view.$('#user-list'));
        this.collection.bind('add', this.add, this);
    },

    render: function() {
        return this;
    },

    add: function(User) {
        var userView = new UserView({model: User});
        User.view = userView;
        $(this.el).append(userView.render().el);
    }
});
