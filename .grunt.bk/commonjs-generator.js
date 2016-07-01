
/*!
 * This file is part of the `srw` project
 *
 * (c) <%= pkg.author %>
 *
 * or the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */


'use strict';

var fs = require('fs');
var path = require('path');

var COMMONJS_BANNER = '// You can require() this file in a CommonJS environment.\n';

module.exports = function generateCommonJSModule(grunt, srcFileList, outFilePath) {
    var outDirPath = path.dirname(outFilePath);

    function requireSrcPathToOut(srcFilePath) {
        var requirePath = path.relative(outDirPath, srcFilePath).replace(/\\/g, '/');
        return 'require(\'' + requirePath + '\');';
    }

    var moduleOutputJs = COMMONJS_BANNER + srcFileList.map(requireSrcPathToOut).join('\n');
    try {
        fs.writeFileSync(outFilePath, moduleOutputJs);
    } catch (err) {
        grunt.fail.warn(err);
    }

    grunt.log.writeln('File ' + outFilePath.cyan + ' created.');
};