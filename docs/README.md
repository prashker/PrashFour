PrashFour
=========

TA: Furkan
Project Members: Samuel Prashker && Christopher Dufour

Name: PrashFour IRC Client

Description:

The goal of this project is to build web based IRC client with the ability to store chat logs and other information on the serverside and allow users to talk to eachother over the internet. This concept lends itself well to additional functionality after the initial build is complete such as: remembering user information, storing text logs and returning them to the user upon re-entry to the chatroom, multiple chatrooms, and others. It is seperated into the server side components that do the actual connection to an IRC server, along with the client side that gets live updates via WebSockets and updates the views appropriately. One of the good features allows the connection to remain active and return to the session and obtain a backlog since the client has left. In IRC world this is called a "Bouncer", and is fairly useful. This project attempted to mimic the best functionality of features displayed in Mibbit and IRCCloud (also web based IRC clients), with the added benefit of being able to self-host the server doing the connections, via Node.

Dependencies used:
 node-irc (Server)
 Mongoose (Server)
 jQuery (Client)
 Express (Sever)
 Jade (Server)
 Socket.io (Server/Client Communication)
 Backbone (Client)
 connect-assets (Server)
 Password-Hash (Server)
 HTML5 (localStorage for Client)
 Twitter Bootstrap (Client)
 Font-Awesome (Client)
 
 
Commands (All commands are typed into the chat box)
===========
 /join #channel: Joins the selected cha
 /part <blank or #channel>: Leaves the active channel or the channel specified
 /nick <newNick>: Changes your nickname to newNick
 /topic <newTopic>: Changes the topic to new topic (if sufficient IRC powers)
 /me: ACTION command (for example /me eats a frog would be outputted *<Nick> eats a frog)
 /query <username>: Opens a query window with username (private messaging)
 /whois <username>: Retrieves the WHOIS information of a user (NOTE: BROKEN BECAUSE NODE-IRC DOES NOT HANDLE AN EVENT PROPERLY, they did not commit a pull request in their repo that fixes it yet)
 /ping: Returns the latency to the Node server from the client (round trip in milliseconds) - The server is continually pinged everytime a ping has been returned....inefficient?
 /backlog <num>: Retrieves the <num> messages in the database for the active channel
 /list: Displays a list in the 'list' channel (via LIST), contains the channel name, topic of the channel, and a join button!
 /clear: Clears the messages in the active channel (clean slate)
 
Features
===========
 Unread Notifications: If a channel receives a message and it is not the active channel in the Bootstrap navbar, it will show a Red Pill with the number of messages you've missed
 Unread Highlights: Similar to unread Notifications, if someone says your nickname, and you are not active in that channel, you will see a blue pill with the number of times your nickname was mentioned
 Emoticon Support: See utils.js for unifiedReplace function, will replace some emoticon text via regular expressions to an image of the emoticon.
 Automatic <a> creation for URLS: See unifiedReplace also, replaces things resembling links into clickable links
 Session Support: Allows logging back in automatically via localStorage storing a randomly generated session ID, associated with a user in the database, if it finds a user with that information, it logs in as them.
 ???
 Username Typeahead: If you are typing into the chat-input box, Bootstrap will present a dropdown of nicknames that start with the text that you are typing, with the userList as the source
 Automatic Retrieval of Backlog: When joining a channel, a backlog retrieval of oldMessages (via getOldMessages) of 50 messages is retrieved and displayed in the MessageList