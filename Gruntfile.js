
/*
 * This file is part of the `srw` project
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines.
  grunt.util.linefeed = '\n';

  // Regex quote function.
  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  // Variable declarations.
  var path;
  var fs;
  var configJson;
  var configValueMake;
  var configMake;
  var configPath;
  var configTask;
  var configList;

  // Import requirements.
  path = require('path');
  fs = require('fs');

  // Parse config json.
  configJson = grunt.file.readJSON('./.grunt/config.json', {
    encoding: 'utf8'
  });

  // Parse config value for sub-config keys.
  configValueMake = function (c) {
    var result = new RegExp('\\$\{([a-z\.]+)\}', 'i').exec(c);

    if (!result || result.length < 2) {
      return c;
    }

    return c.replace(new RegExp(RegExp.quote(result[0]), 'g'), configMake(undefined, result[1]));
  };

  // Get compiled config value.
  configMake = function (section, index, post, pre) {
    var c = configJson;

    if (section) {
      index = section + '.' + index;
    }

    index.split('.').forEach(function (key) {
      c = c[key];
    });

    if (c instanceof Array) {
      return c.map(function (v) {
        return configValueMake(v);
      });
    }

    if (pre)  { c = pre + c;  }
    if (post) { c = c + post; }

    return configValueMake(c);
  };

  // Get config path value.
  configPath = function (index, post, pre) {
    return configMake('paths', index, post, pre);
  };

  // Get config task value.
  configTask = function (index, post, pre) {
    return configMake('tasks', index, post, pre);
  };

  // Get config file listing.
  configList = function (index) {
    return configMake('files', index);
  };

  // Project configuration.
  grunt.initConfig({

    // Gather package metadata.
    pkg : grunt.file.readJSON('package.json'),

    // Get our banner from file.
    banner : function () {
      return fs.readFileSync(configPath('config.banner-text')).toString();
    }(),

    // Clean distribution config.
    clean : {
      js : [
        configPath('out.js')
      ],
      css : [
        configPath('out.css')
      ]
    },

    // Js lint config.
    jshint : {
      options : {
        jshintrc : configPath('src.js', '.jshintrc')
      },
      grunt : {
        options : {
          jshintrc : configPath('src.js', '.jshintrc')
        },
        src : [
          'Gruntfile.js',
          'package.js',
          'grunt/*.js'
        ]
      },
      js : {
        src : configPath('src.js', '*.js')
      }
    },

    // Js tests config.
    jscs : {
      options : {
        config : configPath('src.js', '.jscsrc')
      },
      grunt : {
        src : '<%= jshint.grunt.src %>'
      },
      js : {
        src : '<%= jshint.js.src %>'
      }
    },

    // Dist comments removal.
    decomment : {
      options : {
        type : 'text'
      },
      js : {
        src  : [
          configPath('out.js', '*.js')
        ],
        dest : './',
        cwd  : './'
      },
      css : {
        src  : [
          configPath('out.css', '*.css')
        ],
        dest : './',
        cwd  : './'
      }
    },

    // Dist file banner config.
    usebanner : {
      options : {
        position  : 'top',
        banner    : '<%= banner %>',
        linebreak : true
      },
      js : {
        files : {
          src : [
            configPath('out.js',  '*.js')
          ]
        }
      },
      css : {
        files : {
          src : [
            configPath('out.css', '*.css')
          ]
        }
      }
    },

    // JS concatination config.
    concat : {
      js : {
        src  : configList('js'),
        dest : configPath('out.js', '<%= pkg.name %>.js')
      }
    },

    // Css uglify task config.
    uglify : {
      options: {
        mangle           : true,
        preserveComments : false,
        screwIE8         : true,
        quoteStyle       : 2
      },
      js : {
        src  : '<%= concat.js.dest %>',
        dest : configPath('out.js', '<%= pkg.name %>.min.js')
      }
    },

    // SCSS compilation task config.
    sass: {
      options : {
        includePaths : [
          configPath('src.scss'),
          configPath('bs.scss')
        ],
        precision : 9,
        sourceMap : true,
        outFile   : configPath('out.css', '<%= pkg.name %>.css.map')
      },
      all : {
        src  : configPath('src.scss', '<%= pkg.name %>.scss'),
        dest : configPath('out.css', '<%= pkg.name %>.css')
      }
    },

    // AutoPrefixer task config.
    autoprefixer : {
      options : {
        browsers : configTask('autoprefixer.browserList')
      },
      all : {
        options : {
          map : true
        },
        src : configPath('out.css', '<%= pkg.name %>.css')
      }
    },

    // Css lint task config.
    lesslint : {
      options : {
        csslint : {
          csslintrc         : configPath('src.scss', '.csslintrc'),
          failOnWarning     : false,
          'fallback-colors' : false
        }
      },
      css : {
        src : configPath('out.css', '<%= pkg.name %>.css')
      }
    },

    // Cssmin task config.
    cssmin : {
      options : {
        compatibility       : false,
        keepSpecialComments : false,
        sourceMap           : true,
        advanced            : false
      },
      all : {
        src  : configPath('out.css', '<%= pkg.name %>.css'),
        dest : configPath('out.css', '<%= pkg.name %>.min.css')
      }
    },

    // Csscomb task config.
    csscomb : {
      options : {
        config : configPath('src.scss', '.csscomb.json')
      },
      all : {
        expand : true,
        cwd    : configPath('out.css'),
        src    : [
          '*.css',
          '!*.min.css'
        ],
        dest   : configPath('out.css')
      }
    },

    // Watch task config.
    watch : {
      js : {
        files : configPath('src.js', '**/*.js'),
        tasks : [
          'jshint:js',
          'compile-js'
        ]
      },
      scss : {
        files : configPath('src.scss', '**/*.scss'),
        tasks : [
          'lesslint',
          'compile-css'
        ]
      }
    }
  });

  // Load tasks plugin.
  require('load-grunt-tasks')(grunt, {
    scope : 'devDependencies'
  });

  // Load task timer plugin.
  require('time-grunt')(grunt);

  // Main test task.
  grunt.registerTask('test', [
    'test-js',
    'test-css'
  ]);

  // SCSS/CSS test task.
  grunt.registerTask('test-css', [
    'compile-css',
    'lesslint'
  ]);

  // Javascript test task.
  grunt.registerTask('test-js', [
    'jshint:js',
    'jshint:grunt',
    'jscs:js',
    'jscs:grunt'
  ]);

  // Javascript distribution task.
  grunt.registerTask('compile-js', [
    'concat',
    'uglify',
    'commonjs',
    'decomment:js',
    'usebanner:js'
  ]);

  // SCSS compilation task.
  grunt.registerTask('scss-compile', [
    'sass'
  ]);

  // CSS distribution task.
  grunt.registerTask('compile-css', [
    'scss-compile',
    'autoprefixer',
    'csscomb',
    'cssmin',
    'decomment:css',
    'usebanner:css'
  ]);

  // Main distribution task.
  grunt.registerTask('compile', [
    'compile-css',
    'compile-js'
  ]);

  // Clean distribution task.
  grunt.registerTask('clean-all', [
    'clean:js',
    'clean:css'
  ]);

  // Generate common JS loader.
  grunt.registerTask('commonjs', 'Generate CommonJS entrypoint module in dist dir.', function () {
    var cjs = require(configPath('config.commonjs-generator', undefined, './'));
    cjs(grunt, grunt.config.get('concat.js.src'), configPath('out.js', 'npm.js'));
  });

  // Default task.
  grunt.registerTask('default', [
    'clean-all',
    'test-js',
    'compile',
    'lesslint'
  ]);
};

/* EOF */
