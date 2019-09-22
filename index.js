var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var faker = require('faker');
var loggedInUsers = [];
var messages = [];

function User(socketId, username, colour) {
    this.Id = socketId;
    this.Username = username;
    this.Colour = colour;
}
app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('Someone connected:' + socket.id);
    let colour = '#' + Math.floor(Math.random()*16777215).toString(16);
    let user = new User(socket.id, faker.internet.userName(), colour);
    loggedInUsers.push(user);
    socket.emit("connection", user);
    socket.emit("edit users", loggedInUsers);
    socket.on('message', function(msg){
        messages.push(msg);
        console.log(msg);
        io.emit("message", msg);
    });
});

http.listen(3000, function () {
    console.log('Express server listening on port %d in %s mode', 3000, app.get('env'));
});
