window.utils = {
    // Find and link URLs
    linkify: function(text) {
        //http://daringfireball.net/2010/07/improved_regex_for_matching_urls
        var links = [];
        var re = /\b((?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/gi;
        var parsed = text.replace(re, function(url) {
            // turn into a link
            var href = url;
            if (url.indexOf('http') !== 0) {
                href = 'http://' + url;
            }
            links.push(href);
            return '<a href="' + href + '" target="_blank">' + url + '</a>';
        });
        return parsed;
    },
    
    highlightCheck: function(text) {
        var escape = function(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        };
        var re = new RegExp(escape(irc.me.get('nick')), 'g');
        var parsed = text.replace(re, function(nick) {
            return '<span class="highlight">' + nick + '</span>';
        });
        return parsed;
    }
};
