'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    async = require('async'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    fsq = require('./fsq'),
    watchServer = require('./watch'),
    tbga = require('./tbga');

require('colors');

var root = process.cwd() + '/src';

var PORT = 3000,
    WATCH = false;

var app = express();

/******************************/
    // tbgagain custom change
    // instatntiate express server and
    // setup server and port listeners
/* new code *******************/
var http = require('http').createServer(app);
var io = require('socket.io').listen(http);
var server = http.listen(PORT, function(){
    console.log('listening on *: ', PORT);
});
/******************************/

app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static(root));

function id (x) { return x; }

function render (template, res, injector) {

    injector = injector || id;

    fsq.readFile(template, 'utf-8')
        .then(function (html) {

            return injector(html, PORT);
        })
        .then(function (html) {

            res.writeHeader(200, {'Content-Type': 'text/html'});
            res.write(html);
            res.end();
        })
        .catch(function (err) { throw err; });
}

tbga.init(io);

app.get('/', function (req, res) {

    /******************************/
        // tbgagain custom change
        // move view tmeplates out of root
        // render('index.html', res, WATCH && watchServer.inject);
    /* new code *******************/
    render('views/dev/index.html', res, WATCH && watchServer.inject);
    /******************************/
});

app.get('/editor', function (req, res) {

    /******************************/
        // tbgagain custom change
        // move view tmeplates out of root
        // render('weltmeister.html', res);
    /* new code *******************/
    render('views/dev/weltmeister.html', res);
    /******************************/
});

app.get('/api/glob', function (req, res) {

    async.reduce(req.query.glob, [], function (memo, item, callback) {

        glob(item, {cwd: root}, function (e, matches) {

            for (var i in matches) { memo.push(matches[i]); }

            callback(null, memo);
        });
    },
    function (err, result) {

        res.send(result);
    });
});

app.post('/api/save', function (req, res) {

    var reqPath = req.body.path,
        data = req.body.data;

    reqPath && data ?

        /\.js$/.test(reqPath) ?

            fsq.outputFile(root + '/' + reqPath, data)
                .then(function() {

                    res.send({error: 0});
                })
                .catch(function() {

                    res.send({error: 2, msg: 'Couldn\'t write to file: ' + reqPath});
                })

            :

            res.send({error: 3, msg: 'File must have a .js suffix'})

        :

        res.send({error: 1, msg: 'No Data or Path specified'});
});

app.get('/api/browse', function (req, res) {

    var dir = req.query.dir || '',
        type = req.query.type,
        types = {scripts: ['.js'], images: ['.png', '.gif', '.jpg', '.jpeg']},
        result = {dirs: [], files: []},
        filter, stats, dirpath;

    filter = (type && types[type]) ? types[type] : false;

    result.parent = dir ? dir.substring(0, dir.lastIndexOf('/')) : false;

    dir[dir.length - 1] === '/' && (dir = dir.substring(0, dir.length - 1));

    dir += '/';

    dirpath = path.normalize(path.join(root, dir));

    fs.readdir(dirpath, function (err, files) {

        for (var i in files) {

            var resPath = (dir !== '/' ? dir : '') + files[i];

            stats = fs.statSync(dirpath + files[i]);

            stats.isDirectory() ?
                result.dirs.push(resPath) :
                stats.isFile() &&
                    filter ?
                        filter.indexOf(path.extname(files[i])) >= 0 && result.files.push(resPath) :
                        result.files.push(resPath);
        }

        res.send(result);
    });
});

module.exports = {

    run: function (port, watch) {

        PORT = Number(port[1]) || PORT;
        WATCH = watch[0];

        /******************************/
            // tbgagain custom change
            // instantiate server above
            // var server = app.listen(PORT);
        /******************************/

        console.log('impact-node server is listening at '.green +
                    ('http://localhost:' + PORT).yellow +
                    ' Editor: '.green +
                    ('http://localhost:' + PORT + '/editor').yellow);

        /******************************/
            // tbgagain custom change
            // if (WATCH) { watchServer.run(server); }
        /* new code *******************/
        if (WATCH) { watchServer.run(server, io); }
        /******************************/
    }
};
