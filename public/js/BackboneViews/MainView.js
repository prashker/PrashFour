var MainView = Backbone.View.extend({
    el: '.content',
        
    initialize: function() {
        this.render();
    },

    events: {
        'click #connect-button': 'connect', //connect button clicked
        'click #connect-more-options-button': 'more_options', //more options button clicked
        'click #login-button': 'login', //login button clicked
        'click #register-button': 'register', //register button clicked
        'keypress': 'connectOnEnter', //used mostly for enter key of form submission
        'click #connect-secure': 'toggle_ssl_options' //more-options ssl toggle
    },

    render: function(event) {
        var that = this;
        
        this.$el.html(_.template($("#mainview_wrapper").html()));

        // Navigation to different mainview panes
        // Tell the underscore template if we are loggedIn (to display/show the "keep me logged in" checkbox)
        $('#mainview').html(_.template($("#mainview_" + (event != undefined ? event.currentTarget.id : 'home')).html(), {'loggedIn': irc.loggedIn}));

        $('.mainview-button').bind('click', function(event) {
            //Using the currentTarget.id to render the appropriate template name, see 
            //templates.jade for
            //mainview_home
            //mainview_connection
            //mainview_login
            //mainview_register
            that.render(event);
            //Go to the appropriate mainview page depending on the button pressed
        });
        
        return this;
    },

    connectOnEnter: function(event) {        
        //If we didn't press enter, ignore it
        if (event.keyCode !== 13) {
            return;
        }
        
        //Depending on which page we are, do the appropriate action when enter is pressed
        if ($('#connect-button').length != 0) {
            this.connect();
            event.preventDefault();
        }
        
        if ($('#login-button').length != 0) {
            this.login();
            event.preventDefault();
        }
        
        if ($('#register-button').length != 0) {
            this.register();
            event.preventDefault();
        }
    },

    //connecting
    connect: function(event) {
        event.preventDefault();
        //get all the values from the form
        var server = $('#connect-server').val(),
        nick = $('#connect-nick').val(),
        port = $('#connect-port').val(),
        realName = $('#connect-realName').val() || nick,
        secure = $('#connect-secure').is(':checked'),
        selfSigned = $('#connect-selfSigned').is(':checked'),
        rejoin = $('#connect-rejoin').is(':checked'),
        password = $('#connect-password').val(),
        encoding = $('#connect-encoding').val(),
        keepAlive = false;

        if (irc.loggedIn && $('#connect-keep-alive').length) {
            keepAlive = $('#connect-keep-alive').is(':checked');
        }

        //No verification, but as long as nick and server exist, it will submit
        if (nick && server) {
            $('form').append(_.template($("#load_image").html()));
            $('#connect-button').addClass('disabled');

            var connectInfo = {
                nick: nick,
                server: server,
                port: port,
                secure: secure,
                selfSigned: selfSigned,
                rejoin: rejoin,
                realName: realName,
                password: password,
                encoding: encoding,
                keepAlive: keepAlive
            };

            irc.me = new User(connectInfo);
            irc.me.on('change:nick', irc.appView.renderUserBox); //Useful for nick command
            irc.socket.emit('connect', connectInfo); //MAJOR COMMAND TO START SERVER SIDE
        }
    },

    more_options: function(e) {
        e.preventDefault();
        this.$el.find('.connect-more-options').toggleClass('hide');
    },

    //Login form verification and submission
    login: function() {
        var username = $('#login-username').val();
        var password = $('#login-password').val();

        if (!username) {
            irc.appView.notifyError("Form Error", "Username not specified");
        }

        if (!password) {
            irc.appView.notifyError("Form Error", "Password not specified");
        }

        if (username && password) {
            $('form').append(_.template($("#load_image").html()));
            $('#login-button').addClass('disabled');
            irc.socket.emit('login', {
                username: username,
                password: password
            });
        }

    },
    
    //Register form verification and submission
    register: function() {
        var username = $('#register-username').val();
        var password = $('#register-password').val();

        if (!username) {
            irc.appView.notifyError("Form Error", "Username not specified");
        }

        if (!password) {
            irc.appView.notifyError("Form Error", "Password not specified");
        }

        if (username && password) {
            $('form').append(_.template($("#load_image").html()));
            $('#register-button').addClass('disabled');
            irc.socket.emit('register', {
                username: username,
                password: password
            });
        }
    },

    //When we toggle SSL, change the placeholder default port to 6697
    toggle_ssl_options: function(event) {
        var port = $('#connect-secure').is(':checked') ? 6697 : 6667 ;
        $('#connect-port').attr('placeholder', port);
    }
});
