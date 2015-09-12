'use strict';

var chokidar = require('chokidar'),
    EventEmitter = require('events').EventEmitter,
    clientWatcher = require('./client-watcher');

var root = process.cwd();

function refreshListener (socket, eventArgs) {

    socket.emit('refresh', eventArgs);
}

function injectWatcher (html, port) {

    return html.replace(/<\/body>/, clientWatcher(port) + '</body>');
}

/******************************/
    // tbgagain custom change
    // passing in socket.io instead of creating own
    // instance
    // var watchServer = function (server) {
/* new code *******************/
var watchServer = function (server, io) {
/******************************/

    var socketEvents = new EventEmitter();

    /******************************/
        // tbgagain custom change
        // use passed-in socket.io instead of creating own
        // instance
        // var io = require('socket.io').listen(server, {log: false});
    /* new code *******************/
    io.sockets.on('connection', function (socket) {
    /******************************/

        var refresh = refreshListener.bind(this, socket);

        socketEvents.on('refresh', refresh);

        socket.on('disconnect', function() {

            socketEvents.removeListener('refresh', refresh);
        });
    });

    chokidar.watch(root, {ignored: /[\/\\]\./})
        .on('all', function() {

            socketEvents.emit('refresh', {});
        });
};

module.exports = {

    run: watchServer,
    inject: injectWatcher
};
