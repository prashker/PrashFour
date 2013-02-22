var MainView = Backbone.View.extend({
    el: '.content',
        
    initialize: function() {
        this.render();
    },

    events: {
        'click #connect-button': 'connect',
        'click #connect-more-options-button': 'more_options',
        'click #log-button': 'login',
        'click #reg-button': 'register',
        'keypress': 'connectOnEnter',
        'click #connect-secure': 'toggle_ssl_options'
    },

    render: function(event) {
    $(this.el).html(_.template($("#mainview_main").html()));

    // Navigation to different mainview panes
    $('#mainview').html(_.template($("#mainview_" + (event != undefined ? event.currentTarget.id : 'home')).html(),{'loggedIn': irc.loggedIn}));

    $('.mainview_button').bind('click', $.proxy(this.render, this));
        return this;
    },

    connectOnEnter: function(event) {
        if (event.keyCode !== 13) return;
            if($('#connect-button').length){
            this.connect(event);
        }
        if ($('#log-button').length) {
          this.login();
        }
        if ($('#reg-button').length) {
          this.register();
        }
    },

    connect: function(event) {
        event.preventDefault();
        $('.error').removeClass('error');

        var server = $('#connect-server').val(),
        nick = $('#connect-nick').val(),
        port = $('#connect-port').val(),
        away = $('#connect-away').val(),
        realName = $('#connect-realName').val() || nick,
        secure = $('#connect-secure').is(':checked'),
        selfSigned = $('#connect-selfSigned').is(':checked'),
        rejoin = $('#connect-rejoin').is(':checked'),
        password = $('#connect-password').val(),
        encoding = $('#connect-encoding').val(),
        keepAlive = false;

        if (!server) {
            $('#connect-server').closest('.control-group').addClass('error');
        }

        if (!nick) {
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
                away: away,
                realName: realName,
                password: password,
                encoding: encoding,
                keepAlive: keepAlive
            };

            irc.me = new User(connectInfo);
            irc.me.on('change:nick', irc.appView.renderUserBox);
            irc.socket.emit('connect', connectInfo);
        }
    },

    more_options: function() {
        this.$el.find('.connect-more-options').toggleClass('hide');
    },

    login: function() {
        $('.error').removeClass('error');

        var username = $('#log-username').val();
        var password = $('#log-password').val();

        if (!username) {
            $('#log-username').closest('.clearfix').addClass('error');
            $('#log-username').addClass('error');
        }

        if (!password) {
            $('#log-password').closest('.clearfix').addClass('error');
            $('#log-password').addClass('error');
        }

        if(username && password){
            $('form').append(_.template($("#load_image").html()));
            $('#log-button').addClass('disabled');
        }

        irc.socket.emit(login, {
            username: username,
            password: password
        });
    },
    
    register: function() {
        $('.error').removeClass('error');

        var username = $('#reg-username').val();
        var password = $('#reg-password').val();

        if (!username) {
            $('#reg-username').closest('.clearfix').addClass('error');
            $('#reg-username').addClass('error');
        }

        if (!password) {
            $('#reg-password').closest('.clearfix').addClass('error');
            $('#reg-password').addClass('error');
        }

        if(username && password){
            $('form').append(_.template($("#load_image").html()));
            $('#reg-button').addClass('disabled');
        }

        irc.socket.emit(register, {
            username: username,
            password: password
        });
    },

    toggle_ssl_options: function(event) {
        var port = $('#connect-secure').is(':checked') ? 6697 : 6667 ;
        $('#connect-port').attr('placeholder', port);
    }
});
