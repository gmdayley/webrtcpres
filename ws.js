var express = require('express')
//    app = require('express')()
    , app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

server.listen(process.env.PORT || 3006);

app.use("/", express.static(__dirname));


app.use(express.bodyParser());

var _socket;

app.post("/twilio", function(request, response){
    console.log(request.body);

    if(_socket){
        _socket.emit('twilio', request.body);
    }

    response.send('ok');
});


if(process.env.PORT){
    console.log("Falling back to xhr-polling");
    io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
    });
}



io.sockets.on('connection', function (socket) {
    _socket = socket;

    socket.emit('connection', {});

    socket.on('message', function(msg){
        console.log('message', msg);
        socket.broadcast.emit('msg', msg);
    });

    socket.on('remote value', function(data) {
        socket.broadcast.emit('remote', data);
    });
});