var WebRtc = (function() {
    'use strict';
    var pc_config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
    var mediaConstraints = {'mandatory': {'OfferToReceiveAudio':true, 'OfferToReceiveVideo':true}};

    var started = false,
        localVideo,
        remoteVideo,
        localStream,
        socket,
        pc,
        config = {
            wsAddr: 'http://localhost',
            localVideo: 'local',
            remoteVideo: 'remote'
        };


    function initialize( options ){
        extend(config, options);

        console.log('config', config);

        localVideo = document.getElementById(config.localVideo);
        remoteVideo = document.getElementById(config.remoteVideo);

        setupWS();

        // Send BYE on refreshing(or leaving) a demo page to ensure the room is cleaned for next session.
        window.onbeforeunload = function () {
            socket.emit('message', {type:'bye'});
        }
    }

    function setupWS(){
        socket = io.connect(config.wsAddr);

        socket.on('connection', function(){
            console.log('ws connected');
        });

        socket.on('msg', function(msg){
            console.log('ws', msg)

            if(msg.type == 'offer'){
                createPeerConnection();

                // Set Remote SessionDescription
                pc.setRemoteDescription(new RTCSessionDescription(msg));

                doAnswer();
            }
            else if(msg.type == 'answer'){
                pc.setRemoteDescription(new RTCSessionDescription(msg));
            }
            else if (msg.type === 'candidate') {
                var candidate = new RTCIceCandidate({sdpMLineIndex:msg.label,
                    candidate:msg.candidate});
                pc.addIceCandidate(candidate);
            }
            else if (msg.type === 'bye') {
                onRemoteHangup();
            }
        });
    }

    function createPeerConnection(){
        console.log('create peerconnection');

        pc = new webkitRTCPeerConnection(pc_config);

        pc.addStream(localStream);

        pc.onaddstream = function(event){
            remoteVideo.src = webkitURL.createObjectURL(event.stream);

            if(config.onconnection){
                config.onconnection();
            }
        };

        pc.onicecandidate = onIceCandidate;
    }

    // Callback for IceCandidate
    function onIceCandidate(event) {
        if (event.candidate) {
            socket.emit('message', {type:'candidate',
                label:event.candidate.sdpMLineIndex,
                id:event.candidate.sdpMid,
                candidate:event.candidate.candidate});
        } else {
            console.log("End of candidates.");
        }
    }

    function doCall(){
        pc.createOffer(function(sd){
            pc.setLocalDescription(sd);
            socket.emit('message', sd);
        }, null, mediaConstraints);
    }

    function doAnswer(){
        // Send Answer
        pc.createAnswer(function(sd){
            pc.setLocalDescription(sd);
            socket.emit('message', sd);
        });
    }

    function onRemoteHangup(){
        if(config.ondisconnect){
            config.ondisconnect();
        }
        stop();
    }

    function hangUp(){
        stop();
        socket.emit('message', {type: 'bye'});
    }

    function stop(){
        pc.close();
        pc = null;
    }

    function start(caller) {
        navigator.webkitGetUserMedia({'audio': true, 'video': true},
            function(stream){
                localStream = stream;
                localVideo.src = webkitURL.createObjectURL(stream);

                if(caller){
                    createPeerConnection();
                    doCall();
                }
                started = true;
            }
        );
    }

    function hasStarted(){
        return started;
    }

    /**
     * Extend object a with the properties of object b.
     * If there's a conflict, object b takes precedence.
     */
    function extend( a, b ) {
        for( var i in b ) {
            a[ i ] = b[ i ];
        }
    }


    return {
        initialize: initialize,
        start : start,
        hangUp: hangUp,
        started: hasStarted
    }

})();








