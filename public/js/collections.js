// Collection of messages that belong to a frame
var MessageList = Backbone.Collection.extend({
    model: Message,

    //Returns an array messages that have been unread via _.filter()
    //http://underscorejs.org/#filter
    unread: function() {
        return this.filter(function(message) { 
            return message.get('unread'); 
        });
    },
    
    //Returns an array of messages that have unreadHighlights via _.filter()
    unreadHighlights: function() {
        return this.filter(function(message) { 
            return message.get('unreadHighlgihts'); 
        });
    }
});

// All channels/private message chats a user has open
var WindowList = Backbone.Collection.extend({
    model: ChatWindow,

    initialize: function() {
        this.bind('add', this.setActive, this);
    },

    //Retrieve a ChatWindow via channel name
    getByName: function(name) {
        return this.find(function(chat) {
            return chat.get('name') === name;
        });
    },

    //Retrieve a ChatWindow if it is active (should only be one)
    getActive: function() {
        return this.find(function(chat) {
            return chat.get('active') === true;
        });
    },

    setActive: function(selected) {
        //Get the active channel name
        var name = selected.get('name');
        
        //Unset every channel
        this.each(function(chat) {
            chat.set({active: false});
        });
        
        //Set this one as active, and begin rendering it
        selected.set({active: true});
        selected.view.render();
        
        if (selected.userList) {
            selected.userList.each(function(user) { 
                if (user.has('nick')) {
                    user.view.rebindEvents(); //Hack to fix this, won't be fixed for assignment, but this will rebind the userList buttons
                }
            });
        }
    },

    // Unread messages count
    unreadCount: function() {
        var count = 0;
        //http://stackoverflow.com/questions/7722048/getting-the-sum-of-a-collection-all-models-with-backbone-js
        //http://underscorejs.org/#reduce
        //Boils down the list of unreads to a single value
        count = this.reduce(function(prev, chat) {
          return prev + chat.get('unread');
        }, 0);

        return count;
    },
});

var UserList = Backbone.Collection.extend({
    model: User,

    initialize: function(channel) {
        this.channel = channel;
        this.view = new UserListView({collection:this});
    },

    //Get the User model matching a nickname
    getByNick: function(nick) {
        return this.detect(function(user) {
            return user.get('nick') == nick;
        });
    },

    //Get an array of strings composing of the names of every user
    getUsersNameArray: function() {
        var users = this.map(function(user) {
            return user.get('nick');
        });
        return users;
    }
    
});

