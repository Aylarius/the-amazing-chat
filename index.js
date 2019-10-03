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

    socket.emit("connection", user);
    if (!loggedInUsers.includes(user)) {
        loggedInUsers.push(user);
        io.emit("edit users", loggedInUsers);
    }

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
                let receiver = msg.content.split(" ")[0].replace("@", "");
                let content = msg.content.replace("@"+receiver, "");
                if (loggedInUsers.filter(user => user.Username === receiver).length === 1) {
                    if (user.Username === receiver) {
                        io.to(socket.id).emit('self message sent', receiver, content);
                    } else {
                        socket.broadcast.in(receiver).emit('private message received', user.Username, content);
                        io.to(socket.id).emit('private message sent', receiver, content);
                    }
                }
                break;
            default:
                io.emit("message", msg);
        }
        messages.push(msg);
    });

    socket.on('disconnect', function() {
        loggedInUsers = loggedInUsers.filter(user => user.Id !== socket.id);
        io.emit("edit users", loggedInUsers);
    });
});

http.listen(3000, function () {
    console.log('Express server listening on port %d in %s mode', 3000, app.get('env'));
});
