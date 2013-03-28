var MainView = Backbone.View.extend({
    el: '.content',
        
    initialize: function() {
        this.render();
    },

    events: {
        'click #connect-button': 'connect',
        'click #connect-more-options-button': 'more_options',
        'click #login-button': 'login',
        'click #register-button': 'register',
        'keypress': 'connectOnEnter',
        'click #connect-secure': 'toggle_ssl_options'
    },

    render: function(event) {
        var that = this;
        
        this.$el.html(_.template($("#mainview_main").html()));

        // Navigation to different mainview panes
        $('#mainview').html(_.template($("#mainview_" + (event != undefined ? event.currentTarget.id : 'home')).html(), {'loggedIn': irc.loggedIn}));

        $('.mainview-button').bind('click', function(event) {
            that.render(event);
        });
        
        return this;
    },

    connectOnEnter: function(event) {
        if (event.keyCode !== 13) {
            return;
        }
        
        //Depending on which page we are, do the appropriate action when enter is pressed
        
        if ($('#connect-button').length){
            this.connect(event);
        }
        
        if ($('#login-button').length) {
            this.login();
        }
        
        if ($('#register-button').length) {
            this.register();
        }
    },

    connect: function(event) {
        event.preventDefault();
        $('.error').removeClass('error');

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

        if (!server) {
            //Add error to the respective control-group
            $('#connect-server').closest('.control-group').addClass('error');
        }

        if (!nick) {
            //Add error to the respective control-group
            $('#connect-nick').closest('.control-group').addClass('error');
        }

        if (irc.loggedIn && $('#connect-keep-alive').length) {
            keepAlive = $('#connect-keep-alive').is(':checked');
        }

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
            irc.socket.emit('connect', connectInfo);
        }
    },

    more_options: function(e) {
        e.preventDefault();
        this.$el.find('.connect-more-options').toggleClass('hide');
    },

    login: function() {
        $('.error').removeClass('error');

        var username = $('#login-username').val();
        var password = $('#login-password').val();

        if (!username) {
            $('#login-username').closest('.clearfix').addClass('error');
            $('#login-username').addClass('error');
        }

        if (!password) {
            $('#login-password').closest('.clearfix').addClass('error');
            $('#login-password').addClass('error');
        }

        if (username && password) {
            $('form').append(_.template($("#load_image").html()));
            $('#login-button').addClass('disabled');
        }

        irc.socket.emit('login', {
            username: username,
            password: password
        });
    },
    
    register: function() {
        $('.error').removeClass('error');

        var username = $('#register-username').val();
        var password = $('#register-password').val();

        if (!username) {
            $('#register-username').closest('.clearfix').addClass('error');
            $('#register-username').addClass('error');
        }

        if (!password) {
            $('#register-password').closest('.clearfix').addClass('error');
            $('#register-password').addClass('error');
        }

        if (username && password) {
            $('form').append(_.template($("#load_image").html()));
            $('#register-button').addClass('disabled');
        }

        irc.socket.emit('register', {
            username: username,
            password: password
        });
    },

    toggle_ssl_options: function(event) {
        var port = $('#connect-secure').is(':checked') ? 6697 : 6667 ;
        $('#connect-port').attr('placeholder', port);
    }
});
