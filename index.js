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
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    let colour = '#' + Math.floor(Math.random()*16777215).toString(16);
    let user = new User(socket.id, faker.internet.userName(), colour);

    loggedInUsers.push(user);
    socket.emit("connection", user);
    socket.emit("edit users", loggedInUsers);

    socket.on('join', function (user) {
        socket.join(user.Username);
    });

    socket.on('message', function(msg){
        messages.push(msg);
        io.emit("message", msg);
    });

    socket.on('private message', function (sender, msg) {
        socket.broadcast.in(sender).emit('private message received', sender, msg);
    });

    socket.on('user ping', function () {
        io.to(socket.id).emit('ping received', 'pong');
    });
});

io.on('disconnect', function(socket) {
    loggedInUsers = loggedInUsers.filter(user => user.Id !== socket.id);
    socket.emit("edit users", loggedInUsers);
});

http.listen(3000, function () {
    console.log('Express server listening on port %d in %s mode', 3000, app.get('env'));
});
