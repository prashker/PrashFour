Dependencies
===============

As listed in our package.json (useful for a npm -g install command)

 express: Used to server the server files and javascript content to the client
 node-irc: Used by the server to actually handle the connection to an IRC server and providing an event handler based API to handle IRC events, and consequently forward them to our client via....
 socket.io: The WebSocket technology that allows us to do live communication between server and client, all information about the IRC connection and the login process is done via Socket.IO, as the app is a single page application and does not need to be reloaded, only dynamically populated
 connect-assets: Since we split up our files a lot, there are a lot of javascript files on our client that depend on other javascript files. For everything to work properly we'd either have include all the files in the right order, or simply include //require= statements, and connect-assets handles the nitty gritty for us. A prime example of connect-assets at work is in /views/index.jade, where we only include client.js (connect-sockets sees the include statements inside client.js and serves them automatically to the client) 
 jade: Used for the styling of our HTML and "templates" that Backbone (Underscore uses)
 Backbone: A MVC solution for our client side display. Instead of manipulating the DOM of the website, we associate Views with our page that we can dynamically switch. For exmaple, each channel has their own set of views, models, and collections (basically array of models in Backbone terms), which can be switched independently. What happens is we add our views to the Backbone view, and Backbone will handle actually populating the display for the client
 Underscore: Part of Backbone, we use it primarily for the _.template() commands. Allows us to load "template" snippets of code from templates.jade and populate the variable fields with values. Very useful in combination with Backbone (hence why it is included with it)...this is the heart of populating our view files
 Bootstrap: Used for a variety of nice things, primarily all our buttons, branding, and all otherwise highly complex UI elements
 Font-Awesome: font based "icons", allows a nice display via text