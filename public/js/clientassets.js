//MODELS

App.Message = Ember.Object.extend({
    //default and expected properties
    sender: null,
    raw: null,
    type: 'message',
    
    init: function() {
        if (this.get('raw')) {
            this.set({text: this.get('raw')});
        }
    },
    
    parse: function (text) {
        var nick = this.get('sender');
        var endText = text; //to modify to make nice
        return endText;
    }
});

App.ChatWindow = Ember.Object.extend({
    type: 'channel',
    active: true,
    //unread
    //unreadMentions    
    
    init: function() {
        console.log('chat window created');
        this.stream = new Stream();
    }
});

App.User = Ember.Object.extend({
    opStatus: ''
});

//CONTROLLERS

App.MessageList = Ember.ArrayController.extend({
    content: [],
    
    add: function(message) {
        this.addObject(App.Message.create(message));
    },
    
    unread: function() {
        return this.filter(function(message) {
            return msg.get('unread');
        });
    },
    
    unreadMentions: function() {
        return this.filter(function(message) {
            return msg.get('unreadMention');
        });
    }    

});

App.WindowList = Ember.ArrayController.extend({
    content: [],
    
    getByName: function(name) {
        return this.find(function(chat) {
            return chat.get('name') === name;
        });
    },
    
    getActive: function() {
        return this.find(function(chat) {
            return chat.get('active') === true;
        });
    },
    
    setActive: function (chatWindow) {
        //set this one active, make each other inactive
        //try and replace with some binding or something, ember can do this nicely
        
        this.each(function(w) {
            w.set({active: false});
        });
        
        chatWindow.set({active: true});
    }
       
    
});

App.UserList = Ember.ArrayController.extend({
    content: [],
    
    createUser: function(u) {
        var user = App.User.create({nick: u});
        this.pushObject(user);
        console.log("added thing");
    },
    
    /*
    getUsers: function() {
        return this.getEach('nick');
    }
    */
    
    getUsers: function() {
        return this.content;
    }
});

//VIEWS

App.ApplicationView = Ember.View.extend({
    templateName: 'appView',
    classNames: ['container-fluid'],
    userNameInput: Ember.TextField.extend({
    })
});