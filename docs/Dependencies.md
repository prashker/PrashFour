Dependencies
===============

As listed in our package.json (useful for a npm -g install command) - As well as the requirements on the client side:

* express (MIT License): Used to server the server files and javascript content to the client.
* node-irc (GNU GPL License): Used by the server to actually handle the connection to an IRC server and providing an event handler based API to handle IRC events, and consequently forward them to our client via....
* socket.io (MIT License): The WebSocket technology that allows us to do live communication between server and client, all information about the IRC connection and the login process is done via Socket.IO, as the app is a single page application and does not need to be reloaded, only dynamically populated
* connect-assets (MIT License): Similar to Jade script() tags, we use connect-assets to //require files in another javascript file, and it handles the generation of the <script> tags
* jade (MIT License): Used for the styling of our HTML and "templates" that Backbone (Underscore uses)
* Backbone (MIT License): A MVC solution for our client side display. Instead of manipulating the DOM of the website, we associate Views with our page that we can dynamically switch. For exmaple, each channel has their own set of views, models, and collections (basically array of models in Backbone terms), which can be switched independently. What happens is we add our views to the Backbone view, and Backbone will handle actually populating the display for the client
* Underscore (MIT License): Part of Backbone, we use it primarily for the _.template() commands. Allows us to load "template" snippets of code from templates.jade and populate the variable fields with values. Very useful in combination with Backbone (hence why it is included with it)...this is the heart of populating our view files
* Bootstrap (Apache 2.0 License): Used for a variety of nice things, primarily all our buttons, branding, and all otherwise highly complex UI elements
* Font-Awesome (SIL Open Font License, MIT License, CC BY 3.0 License): font based "icons", allows a nice display via text
* Pines Notify (GPL, LGPL, MPL License): Bubble notification, using Bootstrap and displays various verbose information. 
* Moment.js (MIT License): Used for a robust time parsing/generating snippets.
* jQuery ScrollTo (MIT License): Used for automatically scrolling to the newest message everytime a new message is added to the message window.
* Geometry Soft Pro Font (License: http://www.fontsquirrel.com/license/geometry-soft-pro) Font for Main messages (thought it'd be cool)