var mongoose = require('mongoose');
var IRCSocketConnect = require('./ircsocketconnect');

var Connection = mongoose.model('Connection');

//This is used for the connections that were active but somehow the server itself died, re-launch them on reconnect.

//http://stackoverflow.com/questions/7247541/how-to-findall-in-mongoosejs
module.exports = function (connections) {
    Connection.find({},function(err, docs) {
        docs.forEach(function(doc){
            var connection = new IRCSocketConnect(doc.hostname, doc.port, doc.ssl, doc.selfSigned, doc.nick, doc.realName, doc.password, doc.rejoin, doc.encoding, doc.keepAlive, doc.channels);
            connection.associateUser(doc.user);
            connections[doc.user] = connection;
        });
    });
}