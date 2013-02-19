//requires

App = Ember.Application.create({
    name: "PrashFour",
    loggedIn: false,
    connected: false,
    oneMoreTime: "Kisetsuyo Utsurowanaide",
    oneMoreChance: "Kioku Ni Ashi Wo Torarete"
});

App.userListController = Ember.ArrayProxy.create({
    content: []
});

App.userListController.pushObjects([
    {name: "Washing machine", rating: 4.5},
    {name: "Blow Dryer", rating: 3.5},
    {name: "Laptop", rating: 4.9},
    {name: "Microwave Oven", rating: 2.7},
    {name: "Lawn Mower", rating: 5.0}
]);

$(function() {
        
});
