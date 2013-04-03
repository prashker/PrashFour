Files
=======

/lib/
========
* ircsocketconnect.js: Creates the actual IRC connection to the server via node-irc, creates an event handler for all events to be passed to socket.io to be forwarded to the client side
* sockethandler.js: Handles the requests sent TO the server from the client. Aka all the commands, join/part/query, etc. It forwards from the socket to the actual node-irc instance of the connection, and calls upon its APIs
* mongooseschema.js: Since Mongoose allows schema, this is the format of our database, consisting of a user and log of messages tied to that user
* prashfour.js: Launches the listening server, launches the socket server, and awaits connections from the client


/views/
======
* index.jade: Loads the javascript files used to manipulate the DOM (Backbone) and access to the templates (mainly client.js, which has the others via connect-assets)
* template.jade: Contains all the templates used to populate the visuals on the client side

/
======
* app.js: Entry point to the application
* config.js: Some variables that can be tweaked (PORT and MONGODB PATH)

/public/css/
========
* style.css: Our design based upon nice color schemes form http://www.colorcombos.com/color-scheme-138.html. Includes some workarounds to counteract Bootstrap limitations

/public/js/
===========
* client.js: Entry point of the client side, starts the connection to the server socket, initiates Backbone and the "Welcome" view, also responsible for handling the commands the user types, and the socket events it receives from the server (new message, new join, new query, etc)
* models.js: Backbone maintains a list of models, simplified to Message, ChatWindow and User
* collections.js: Array of models, in this case, Models, ChatWindows, Users
* router.js: Handles the #hashtag based URL of each page. Currently in progress...

/public/js/BackboneViews/
========
* ChannelListView.js: The view for the channel list
* ChannelTabView.js: The view for the tabs of each channel (handles the events of switching channel, leaving channel, etc)
* ChatView.js: One of the more important views, the actual ChatWindow, which consists of the message view (list of messages), user list (list of users in this channel), and chat-input
* PrashFourApplicationView: The wrapper for the whole application, it has a method that replaces the html of $('body')
* MainView.js: This is the dialog window that consists of the connection window, the register window, and the login window, prior to the chat view loading up
* MessageView.js: The view associated with a SINGLE message (used in conjunction with chat.js)
* UserAnduserListView.js: The view associated with both a SINGLE message and a LIST of messages (used in conjunction with chat.js)

/public/images/
=======
All emoticons taken from Mibbit's Emoticon Page