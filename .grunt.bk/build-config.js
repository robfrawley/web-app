
/*!
 * This file is part of the `srw` project
 *
 * (c) <%= pkg.author %>
 *
 * or the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

'use strict';

class BuildConfig {
  constructor(grunt, file) {
    this.grunt = grunt;

    this.readConfig(file);
    this.writeMain('Build Config Loading');
  }

  readConfig(file) {
    this.config = this.grunt.file.readJSON(file, {
      encoding: 'utf8'
    });
  }

  static regexQuote(string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  resolveValue(value) {
    var parsed = value.toString();
    var search;
    var replaceRegex;
    var replaceValue;
    var i = 0;

    while (true) {
      search = new RegExp('\\$\{([a-z\.-]+)\}', 'i').exec(parsed);

      if (!search || search.length < 2 || i++ > 10) {
        break;
      }

      replaceValue = this.getConfig(undefined, search[1], {silent: true});
      replaceRegex = new RegExp(BuildConfig.regexQuote(search[0]), 'g');

      if (replaceValue) {
        parsed = parsed.replace(replaceRegex, replaceValue);
      }
    }

    return parsed;
  }

  resolveArray(a) {
    return a.map(function (value) {
      return this.resolveValue(value);
    }.bind(this));
  }

  findIndex(search) {
    var config = this.config;

    search.split('.').forEach(function (p) {
      config = config[p];

      if (!config) {
        throw new Error('Error resolving value at index fragment: ' + index);
      }
    });

    return config;
  }

  static prePostValue(v, opts) {
    if (opts && opts['pre']) {
      v = opts.pre + v;
    }

    if (opts && opts['post']) {
      v = v + opts.post;
    }

    return v;
  }

  static prePostArray(a, opts) {
    return a.map(function (value) {
      return BuildConfig.prePostValue(value, opts);
    });
  }

  getConfig(context, index, opts, silent) {
    if (context) {
      index = context + '.' + index;
    }

    var msg = 'Resolve ' + index + '...';
    if (!opts || opts['silent'] !== true) {
      this.writeAction(msg);
    }

    try {
      var value = this.findIndex(index);
    } catch(e) {
      this.error(e, msg, 'Could not build config for ' + index);
    }

    try {
      value = value instanceof Array ? this.resolveArray(value) : this.resolveValue(value);
    } catch(e) {
      this.error(e, msg, 'Could not resolve value string for ' + index);
    }

    if (!opts || opts['silent'] !== true) {
      this.doneAction();
    }

    console.log(index);
    console.log(value instanceof Array ? BuildConfig.prePostArray(value, opts) : BuildConfig.prePostValue(value, opts));

    return value instanceof Array ? BuildConfig.prePostArray(value, opts) : BuildConfig.prePostValue(value, opts);
  }

  getPath(index, opts) {
    return this.getConfig('paths', index, opts);
  }

  getFiles(index, opts) {
    return this.getConfig('files', index, opts);
  }

  getTask(index, opts) {
    return this.getConfig('tasks', index, opts);
  }

  writeMain(msg) {
    this.grunt.verbose.writeln(msg);
  }

  writeAction(msg) {
    this.grunt.verbose.write(' > ' + msg);
  }

  doneAction() {
    this.grunt.verbose.ok();
  }

  error(e, writeMsg, failMsg) {
    this.grunt.verbose.or.write(writeMsg).error().error(e.message);
    this.grunt.fail.warn(failMsg);
  }
}

module.exports = BuildConfig;
