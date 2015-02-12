var UglifyJS = require('uglify-js'),
    colors = require('colors'),
    fs = require('fs'),
    fse = require('fs-extra');

var currDir = process.cwd(),
    root = currDir + '/src',
    lib = root + '/lib/';

var pattern = 'ig\\s*\\.\\s*module\\s*\\((.*?)\\)\\s*(\\.\\s*requires\\s*\\((.*?)\\)\\s*)?\\.\\s*defines\\s*\\(',
    header = '/*! Built with IMPACT - impactjs.com */\n\n';

var regexp = new RegExp(pattern),
    regexpg = new RegExp(pattern, 'g');

var impactCore = lib + 'impact/impact.js',
    main = lib + 'game/main.js',
    output = currDir + '/build/game.js';

var loaded = {};

function build() {

    try {

        var code = UglifyJS.minify(

            [impactCore, main]
                .map(unwrap)
                .reduce(function (concat, code) { return concat + code; }),

            {fromString: true}).code;

    } catch (error) {

        throw error;
    }

    fse.outputFile(output, header + code, function (err) {

        if (err) { throw err; }

        process.stdout.write(('\nBuild successful! Output size: ' +
            (Math.round(fs.statSync(output).size / 10) / 100 + ' kB\n').yellow).green);
    });
}

function unwrap (path) {

    if (loaded[path]) { return ''; }

    loaded[path] = true;

    process.stdout.write('Files compiled: ' + Object.keys(loaded).length + '\r');

    var code = UglifyJS.minify(path).code;

    return code.replace(regexpg, explode(code.match(regexp), path));
}

function explode (matches, path) {

    var imports = matches[3] || '',
        importedCode = '';

    if (imports) {

        importedCode = imports
            .split(',')
            .map(removeQuotes)
            .filter(excludeDomReady)
            .map(moduleToPath)
            .map(unwrapR)
            .join('');
    }

    return importedCode + 'ig.baked=true;' +
        'ig.module(' + matches[1] + ')' +
        (imports ? '.requires(' + imports + ')' : '') +
        '.defines(';
}

function excludeDomReady (module) {

    return module !== 'dom.ready';
}

function moduleToPath (module) {

    return module.replace('.', '/');
}

function removeQuotes (module) {

    return module.replace(/[\s\'"]|\/\/.*|\/\*.*\*\//g, '');
}

function unwrapR (module) {

    return unwrap(lib + module + '.js');
}

module.exports = build;