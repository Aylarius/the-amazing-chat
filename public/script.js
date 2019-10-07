$(function () {
    let socket = io();
    let currentUser;
    let connectedUsers;
    let message = $('#msg');
    let messagesSelector = $('#messages');
    let usersSelector = $('#users');

    messagesSelector.change(function () {
            messagesSelector.animate({ scrollTop: messagesSelector.height() }, 300);
        }
    );
    usersSelector.change(function () {
            usersSelector.animate({ scrollTop: usersSelector.height() }, 300);
        }
    );

    function addMessage(content, color) {
        messagesSelector.append($('<li>').text(content).css({ "background-color": color, "border-left": "5px solid #ccc" })).trigger('change');
    }

    socket.on('connection', function(user){
        $('#user').text(user.Username);
        $('#colour').text(user.Colour);
        currentUser = user;
        socket.emit('join', user);
    });
    $('form').submit(function(e){
        e.preventDefault();
        if (message.val().trim().length >= 1) {
            let msg = { author: currentUser.Username, content: message.val(), colour: currentUser.Colour };
            socket.emit("message", msg);
            message.val('');
        }
        return false;
    });
    socket.on('message', function(msg){
        addMessage(msg.author + ' said: ' + msg.content, msg.colour);
    });
    socket.on('internal message', function(msg){
        addMessage(msg, 'lightgrey');
    });
    socket.on('edit users', function(users){
        usersSelector.html('');
        $('#count').html(users.length);
        for (let user of users) {
            usersSelector.append($('<li>').text(user.Username)).trigger('change');
        }
        connectedUsers = users;
    });
    socket.on('private message received', function (sender, msg){
        addMessage(sender + ' (privately) said: ' + msg, 'coral');
    });
    socket.on('private message sent', function (receiver, msg){
        addMessage('(To ' + receiver +') You said: ' + msg, 'coral');
    });
    socket.on('self message sent', function (receiver, msg){
        addMessage('You said to yourself: ' + msg, 'lightblue');
    });
    socket.on('ping received', function(msg){
        alert(msg);
        addMessage('Server said: ' + msg, 'lightgrey');
    });
});
