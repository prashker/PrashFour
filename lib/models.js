var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
  
  
module.exports = function() {
  var Users = new Schema({
    username: { type: String , index: {unique: true}},
    password: String
    //Additional Settings?
  });
  
  var Connections = new Schema({
    user: String,
    hostname: String,
    port: Number,
    ssl: Boolean,
    rejoin: Boolean,
    realName: String,
    selfSigned: Boolean,
    channels: [String],
    nick: String,
    password: String,
    encoding: String,
    keepAlive: Boolean
  });
  
  var Messages = new Schema({
    linkedto: String, //Username of who's account this log is associated with
    channel: String, //Channel of the message
    server: String, //Which server
    user: String, //Who said the message
    message: String, //Message
    date: { type: Date, default: Date.now } //Date
  });
  
  mongoose.model('User', Users);
  mongoose.model('Connection', Connections);
  mongoose.model('Message', Messages);
};
