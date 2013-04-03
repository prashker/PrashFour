var MessageView = Backbone.View.extend({
    className: 'message-box',
    
    initialize: function() {
        this.render();
    },

    render: function() {
        var nick = this.model.get('sender') || this.model.collection.channel.get('name');
        
        var html;

        if (_.include(['join', 'part', 'nick', 'topic', 'quit'], this.model.get('type'))) {
            html = this.setText(this.model.get('type'));
        }
        else if (this.model.get('text') && this.model.get('text').substr(1, 6) === 'ACTION') {
            html = _.template($('#action-message').html(), {
                user: nick,
                content: this.model.get('text').substr(8),
                timeStamp: this.model.get('timeStamp') || moment().format('ddd MMM D YYYY, h:mmA')
            });
            html = this.model.parse(html);
        } 
        else {
            html = _.template($("#message").html(), {
                user: nick,
                type: this.model.get('type'),
                content: this.model.get('text'),
                timeStamp: this.model.get('timeStamp') || moment().format('ddd MMM D YYYY, h:mmA')
            });
            html = this.model.parse(html);
        }

        this.$el.html(html);
        return this;
    },

    // Set output text for status messages
    setText: function(type) {
        var html = '';
        switch (type) {
            case 'join':
            case 'part':
                html = _.template($("#joinpart-message").html(), {
                    type: type,
                    nick: this.model.get('nick'),
                    action: type === 'join' ? 'joined' : 'left',
                    reason: ''
                });
                break;
            case 'quit':
                html = _.template($("#joinpart-message").html(), {
                    type: 'part',
                    nick: this.model.get('nick'),
                    action: 'left',
                    reason: this.model.get('reason') !== 'undefined' ? '('+this.model.get('reason')+')' : '(leaving)'
                });
                break;
            case 'nick':
                html = _.template($("#nickchange-message").html(), {
                    oldNick: this.model.get('oldNick'),
                    newNick: this.model.get('newNick')
                });
                break;
            case 'topic':
                html = _.template($("#topic-message").html(), {nick: this.model.get('nick'), topic: this.model.get('topic')});
                break;
        }
        return html;
    }
});
