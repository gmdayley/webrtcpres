var express = require('express')
//    app = require('express')()
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3006);

app.use("/", express.static(__dirname));


io.sockets.on('connection', function (socket) {
    socket.emit('connection', {});

    socket.on('message', function(msg){
        console.log('message', msg);
        socket.broadcast.emit('msg', msg);
    });

    socket.on('remote value', function(data) {
        socket.broadcast.emit('remote', data);
    });
});