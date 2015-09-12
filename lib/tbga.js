// var config = require('./config');

var config = {

    MAX_PLAYERS : 4,
    KILL_TIMEOUT : 180000
};

function getOtherPlayers (id) {

    console.log('getOtherPlayers()');

    // console.log('id ', id);

    // console.log('players ', players);

    var otherPlayers = {};

    for (var playerId in players) {

        if (playerId !== id) {

            // console.log('playerId ', playerId);
            // console.log('id ', id);

            console.log(players[playerId]);

            otherPlayers[playerId] = players[playerId];

            delete otherPlayers[playerId].socket;
        }
    }

    // console.log(otherPlayers);

    return otherPlayers;
}

function getPlayersArray () {

    console.log('getPlayersArray()');

    var playersArray = [];

    var ids = Object.keys(players);

    ids.forEach(function (id) {

        playersArray.push(players[id]);
    });

    console.log(playersArray);

    return playersArray;
}

function getPlayerCount () {

    return getPlayersArray().length;
}

function getPlayerNumbers () {

    console.log('getPlayerNumbers()');

    var numbers = [];

    var players = getPlayersArray();

    players.forEach(function (player) {

        if (!isNaN(player.playerNumber)) {

            numbers.push(player.playerNumber);
        }
    });

    console.log(numbers);

    return numbers.sort();
}

function getPlayerNumber () {

    var playerNumber = 0;

    var usedNumbers = getPlayerNumbers();

    for (var i = 0, j = config.MAX_PLAYERS; i < j; i++) {

        if (usedNumbers.indexOf(i) < 0) {

            playerNumber = i;
            break;
        }
    }

    return playerNumber;
}

function disconnectPlayer (id) {

    console.log('disconnectPlayer()');

    console.log('id ', id);

    var player = players[id];

    // console.log(player);

    var socket = getPlayerSocket(id);

    if (socket) {

        socket.emit('disconnectPlayer');

        socket.disconnect();
    }

}

function getPlayerSocket(id) {

    return io.sockets.connected[id];
}

function removePlayer (id) {

    players[id] = null;

    delete players[id];
}

var players = {};

var io;

function init (socketio) {

    io = socketio;

    socketio.sockets.on('connection', function(socket){

        console.log('a user connected');

        var playerNumber;

        socket.on('disconnect', function() {

            console.log('user disconnected');

            removePlayer(socket.id);

            socket.broadcast.emit('playerDisconnect', {
                id : socket.id
            });
        });

        socket.on('playerMove', function (data) {

            // console.log('playerMove');

            // console.log(data);

            var player = players[socket.id];

            player.pos.x = data.pos.x;

            player.pos.y = data.pos.y;

            player.vel.x = data.vel.x;

            player.vel.y = data.vel.y;

            // broadcast that out to everyone else

            socket.broadcast.emit('playerMove', {
                id : player.id,
                pos : {
                    x : player.pos.x,
                    y : player.pos.y
                },
                vel : {
                    x : player.vel.x,
                    y : player.vel.y
                }
            });

            // clear timeout

            if (this.killtimeout) {

                clearTimeout(this.killtimeout);
            }

            //start new timeout

            this.killtimeout = setTimeout(function () {

                disconnectPlayer(socket.id);

            }, config.KILL_TIMEOUT);
        });

        socket.on('gameStart', function(callback) {

            console.log('gameStart');

            if (getPlayerCount() < config.MAX_PLAYERS) {

                players[socket.id] = {
                    id : socket.id,
                    pos : {
                        x : 0,
                        y : 0
                    },
                    vel : {
                        x : 0,
                        y : 0
                    }
                }

            } else {

                console.log('max players - no free slots');
            }

            playerNumber = getPlayerNumber();

            players[socket.id].playerNumber = playerNumber;

            callback({

                playerNumber : playerNumber
            });

        });

        socket.on('playerStart', function() {

            console.log('playerStart');

            if (getPlayerCount() < config.MAX_PLAYERS) {

                socket.emit('initialisePlayer', {
                    otherPlayers : getOtherPlayers(socket.id),
                    playerNumber : playerNumber
                });

                socket.broadcast.emit('newPlayer', {
                    id : socket.id,
                    playerNumber : playerNumber
                });

            } else {

                console.log('max players - no free slots');
            }
        });
    });
}

module.exports = {

    init : init
};