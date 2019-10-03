const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const faker = require('faker');
let loggedInUsers = [];
let messages = [];

function User(socketId, username, colour) {
    this.Id = socketId;
    this.Username = username;
    this.Colour = colour;
}
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', function(socket){
    let colour = '#' + Math.floor(Math.random()*16777215).toString(16);
    let user = new User(socket.id, faker.internet.userName(), colour);

    loggedInUsers.push(user);
    socket.emit("connection", user);
    io.emit("edit users", loggedInUsers);

    socket.on('join', function (user) {
        socket.join(user.Username);
    });

    socket.on('message', function(msg){
        switch (true) {
            case msg.content.startsWith('/whoami'):
                socket.emit("internal message", 'You are ' + user.Username);
                break;
            case msg.content.startsWith('/date'):
                let date = new Date().toLocaleDateString('en-US');
                socket.emit("internal message", 'The current date is ' + date);
                break;
            case msg.content.startsWith('/ping'):
                io.to(socket.id).emit('ping received', 'pong');
                break;
            case msg.content.startsWith('@'):
                let sender = msg.content.split(" ")[0].replace("@", "");
                let content = msg.content.replace("@"+sender, "");
                if (loggedInUsers.includes(sender)) {
                    socket.emit('private message', sender, content);
                }
                break;
            default:
                io.emit("message", msg);
        }
        messages.push(msg);
    });

    socket.on('private message', function (sender, msg) {
        socket.broadcast.in(sender).emit('private message received', sender, msg);
    });

    socket.on('disconnect', function() {
        console.log('disconnect => ' + socket.id);
        loggedInUsers = loggedInUsers.filter(user => user.Id !== socket.id);
        io.emit("edit users", loggedInUsers);
    });
});

http.listen(3000, function () {
    console.log('Express server listening on port %d in %s mode', 3000, app.get('env'));
});
