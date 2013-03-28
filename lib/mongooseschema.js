var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

//http://mongoosejs.com/docs/guide.html
/*
    var blogSchema = new Schema({
      title:  String,
      author: String,
      body:   String,
      comments: [{ body: String, date: Date }],
      date: { type: Date, default: Date.now },
      hidden: Boolean,
      meta: {
        votes: Number,
        favs:  Number
      }
    });
*/
  
  
module.exports = function() {
    //http://mongoosejs.com/docs/models.html
    //Three Models
    //Users (Logging In System)
    //Connections (Associate the connection to the user)
    //Messages (backlog for the associated ofuser)

    var Users = new Schema({
        username: { type: String , index: {unique: true}},
        password: String,
        lastSession: {type: String, default: ""}
    });

    var Messages = new Schema({
        ofuser: String, //Username of who's account this log is associated with
        channel: String, //Channel of the message
        server: String, //Which server
        user: String, //Who said the message
        message: String, //Message
        date: { type: Date, default: Date.now() } //Defaults to the current time
    });

    mongoose.model('User', Users); //can instantiate new User()
    mongoose.model('Message', Messages); //can instantiate new Message()
};
