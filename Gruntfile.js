
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

  // Get compiled config value.
  configMake = function (section, index, post, pre) {
    var c = configJson;

    index = section + '.' + index;
    index.split('.').forEach(function (key) {
      c = c[key];
    });

    if (pre) {
      c = pre + c;
    }

    return post ? c + post : c;
  };

  // Get config path value.
  configPath = function (index, post, pre) {
    return configMake('paths', index, post, pre).toString();
  };

  // Get config task value.
  configTask = function (index, post) {
    return configMake('tasks', index, post).toString();
  };

  // Get config file listing.
  configList = function (index, post) {
    return configMake('paths.buildFileList', index, post);
  };

  // Project configuration.
  grunt.initConfig({

    // Gather package metadata.
    pkg : grunt.file.readJSON('package.json'),

    // Get our banner from file.
    banner : function () {
      return fs.readFileSync(configPath('config.banner')).toString();
    }(),

    // Clean config.
    clean : {
      dist : [
        configPath('dist.less'),
        configPath('dist.js')
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
      all : {
        options : {
          type : 'text'
        },
        src  : [
          configPath('dist.js', '*.js'),
          configPath('dist.less', '*.css')
        ],
        dest : './',
        cwd  : './'
      }
    },

    // Dist file banner config.
    usebanner : {
      all : {
        options : {
          position  : 'top',
          banner    : '<%= banner %>',
          linebreak : true
        },
        files : {
          src : [
            configPath('dist.js', '*.js'),
            configPath('dist.less', '*.css')
          ]
        }
      }
    },

    // JS concatination config.
    concat : {
      js : {
        src  : configList('js'),
        dest : configPath('dist.js', '<%= pkg.name %>.js')
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
        dest : configPath('dist.js', '<%= pkg.name %>.min.js')
      }
    },

    // Less compilation task config.
    less : {
      all : {
        options : {
          strictMath        : true,
          sourceMap         : true,
          outputSourceFiles : true,
          sourceMapURL      : '<%= pkg.name %>.css.map',
          sourceMapFilename : configPath('dist.less', '<%= pkg.name %>.css.map')
        },
        src  : configPath('src.less', '<%= pkg.name %>.less'),
        dest : configPath('dist.less', '<%= pkg.name %>.css')
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
        src : configPath('dist.less', '<%= pkg.name %>.css')
      }
    },

    // Csslint task config.
    lesslint : {
      options : {
        csslint : {
          csslintrc     : configPath('src.less', '.csslintrc'),
          failOnWarning : false,
          'fallback-colors': false
        }
      },
      less : {
        imports : [
          configPath('src.less', '**/*.less')
        ],
        src     : configPath('dist.less', '<%= pkg.name %>.css')
      },
      css : {
        src : configPath('dist.less', '<%= pkg.name %>.css')
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
        src  : configPath('dist.less', '<%= pkg.name %>.css'),
        dest : configPath('dist.less', '<%= pkg.name %>.min.css')
      }
    },

    // Csscomb task config.
    csscomb : {
      options : {
        config : configPath('src.less', '.csscomb.json')
      },
      all : {
        expand : true,
        cwd    : configPath('dist.less'),
        src    : [
          '*.css',
          '!*.min.css'
        ],
        dest   : configPath('dist.less')
      }
    },

    // Watch task config.
    watch : {
      js : {
        files : '<%= jshint.main.src %>',
        tasks : [
          'jshint:main',
          'concat'
        ]
      },
      less : {
        files : configPath('src.less', '**/*.less'),
        tasks : [
          'less'
        ]
      }
    }
  });

  // Loadtasks plugin.
  require('load-grunt-tasks')(grunt, {
    scope: 'devDependencies'
  });

  // Load task timer plugin.
  require('time-grunt')(grunt);

  // Test task.
  grunt.registerTask('test', [
    'test-js',
    'test-less'
  ]);

  // LESS test task.
  grunt.registerTask('test-less', [
    'lesslint:less',
    'dist-css',
    'lesslint:css'
  ]);

  // JS test task.
  grunt.registerTask('test-js', [
    'jshint:js',
    'jshint:grunt',
    'jscs:js',
    'jscs:grunt'
  ]);

  // JS distribution task.
  grunt.registerTask('dist-js', [
    'concat',
    'uglify',
    'commonjs'
  ]);

  // Less compilation task.
  grunt.registerTask('less-compile', [
    'less'
  ]);

  // CSS distribution task.
  grunt.registerTask('dist-css', [
    'less-compile',
    'autoprefixer',
    'csscomb',
    'cssmin'
  ]);

  // Full distribution task.
  grunt.registerTask('dist', [
    'dist-css',
    'dist-js',
    'decomment',
    'usebanner'
  ]);

  // Default task.
  grunt.registerTask('default', [
    'clean:dist',
    'dist'
  ]);

  // Generate common JS loader.
  grunt.registerTask('commonjs', 'Generate CommonJS entrypoint module in dist dir.', function () {
    var cjs = require(configPath('config.commonjs-generator', undefined, './'));
    cjs(grunt, grunt.config.get('concat.js.src'), configPath('dist.js', 'npm.js'));
  });
};

/* EOF */
