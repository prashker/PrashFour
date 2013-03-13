window.utils = {
    unifiedReplace: function (text) {
        //url and emoticons
        //http://stackoverflow.com/questions/9200355/javascript-converting-plain-text-to-links-smilies
        
        // First pass: creating url and smilie maps
        var urlSubstitutions = [];
        var smilieSubstitutions = [];
        
        var smilies = {
            ':)' : 'smile.gif',
            ':(' : 'sad.gif',
            ':S' : 'confused.gif',
            ':D' : 'grin.gif',
            ':/' : 'rolleyes.gif',
            ':o' : 'surprised.gif',
            ':p' : 'tongue.gif',
            ';)' : 'wink.gif',
        }

        text = text.replace(/\b((http:\/\/)|(www\.))[^ ]{5,}/g, function(match) {
            var b = match;
            if (b.indexOf("www") == 0) {
                b = "http://" + b;
            }

            urlSubstitutions.push({ anchor: match, url: b });
            return "{{_u_" + urlSubstitutions.length + "_}}";
        });
        
        for (s in smilies) {
            text = text.replace(new RegExp(s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "g"), function(x){
                smilieSubstitutions.push({ smilie: x, image: smilies[s] });
                return "{{_s_" + smilieSubstitutions.length + "_}}";
            });
        }
        
        // Second pass: applying urls and smilies
        text = text.replace(/{{_u_(\d+)_}}/g, function(match, index) {
            var substitution = urlSubstitutions[parseInt(index)-1];
            return '<a href="' + substitution.url + '" target="_blank">' + substitution.anchor + "</a>";
        });

        text = text.replace(/{{_s_(\d+)_}}/g, function(match, index) {
            var substitution = smilieSubstitutions[parseInt(index)-1];
            return '<img src="/images/' + substitution.image + '"/>';
        });

        return text;
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
