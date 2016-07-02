
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

  grunt.util.linefeed = '\n';

  var Path = require('path');
  var FS   = require('fs');
  var Conf = require('./.grunt/build-config.js');
  var CB   = new Conf(grunt, '.grunt/config.json');

  var commonJsTask = function () {
    var cjs = require(CB.getPath('grunt.commonjs-generator', {pre: './'}));
    cjs(grunt, grunt.config.get('concat.js.src'), CB.getPath('src.to.script', {post: 'npm.js'}));
  };

  grunt.initConfig({
    pkg : grunt.file.readJSON('package.json'),

    banner : function () {
      return FS.readFileSync(CB.getPath('grunt.banner-contents', {pre: './'})).toString();
    }(),

    clean : {
      script : [
        CB.getPath('src.to.script')
      ],
      style : [
        CB.getPath('src.to.style')
      ]
    },

    jshint : {
      options : {
        jshintrc : CB.getPath('src.to.script', {post: '.jshintrc'})
      },
      grunt : {
        options : {
          jshintrc : CB.getPath('src.to.script', {post: '.jshintrc'})
        },
        src : [
          'Gruntfile.js',
          'package.js',
          'grunt/*.js'
        ]
      },
      script : {
        src : CB.getPath('src.to.script', {post: '*.js'})
      }
    },

    jscs : {
      options : {
        config : CB.getPath('src.to.script', {post: '.jscsrc'})
      },
      grunt : {
        src : '<%= jshint.grunt.src %>'
      },
      script : {
        src : '<%= jshint.script.src %>'
      }
    },

    decomment : {
      options : {
        type : 'text'
      },
      script : {
        src  : [
          CB.getPath('src.to.script', {post: '*.js'})
        ],
        dest : './',
        cwd  : './'
      },
      style : {
        src  : [
          CB.getPath('src.to.style', {post: '*.css'})
        ],
        dest : './',
        cwd  : './'
      }
    },

    usebanner : {
      options : {
        position  : 'top',
        banner    : '<%= banner %>',
        linebreak : true
      },
      script : {
        files : {
          src : [
            CB.getPath('src.to.script', {post: '*.js'})
          ]
        }
      },
      style : {
        files : {
          src : [
            CB.getPath('src.to.style', {post: '*.css'})
          ]
        }
      }
    },

    concat : {
      script : {
        src  : CB.getFiles('jquery.in.script').concat(CB.getFiles('plug-bs.in.script').concat(CB.getFiles('plug-waypoints.in.script').concat(CB.getFiles('srw.in.script')))),
        dest : CB.getPath('src.to.script', {post: '<%= pkg.name %>.js'})
      }
    },

    uglify : {
      options: {
        mangle           : true,
        preserveComments : false,
        screwIE8         : true,
        quoteStyle       : 2
      },
      script : {
        src  : '<%= concat.script.dest %>',
        dest : CB.getPath('src.to.script', {post: '<%= pkg.name %>.min.js'})
      }
    },

    sass: {
      options : {
        includePaths : [
          CB.getPath('src.in.style'),
          CB.getPath('plug-bs.in.style')
        ],
        precision : 9,
        sourceMap : true,
        outFile   : CB.getPath('src.to.style', {post: '<%= pkg.name %>.css.map'})
      },
      style : {
        src  : CB.getPath('src.in.style', {post: '<%= pkg.name %>.scss'}),
        dest : CB.getPath('src.to.style', {post: '<%= pkg.name %>.css'})
      }
    },

    autoprefixer : {
      options : {
        browsers : CB.getTask('autoprefixer.browserList')
      },
      style : {
        options : {
          map : true
        },
        src : CB.getPath('src.to.style', {post: '<%= pkg.name %>.css'})
      }
    },

    lesslint : {
      options : {
        csslint : {
          csslintrc         : CB.getPath('src.in.style', {post: '.csslintrc'}),
          failOnWarning     : false,
          'fallback-colors' : false
        }
      },
      style : {
        src : CB.getPath('src.to.style', {post: '<%= pkg.name %>.css'})
      }
    },

    cssmin : {
      options : {
        compatibility       : false,
        keepSpecialComments : false,
        sourceMap           : true,
        advanced            : false
      },
      style : {
        src  : CB.getPath('src.to.style', {post: '<%= pkg.name %>.css'}),
        dest : CB.getPath('src.to.style', {post: '<%= pkg.name %>.min.css'})
      }
    },

    csscomb : {
      options : {
        config : CB.getPath('src.in.style', {post: '.csscomb.json'})
      },
      style : {
        expand : true,
        cwd    : CB.getPath('src.to.style'),
        src    : [
          '*.css',
          '!*.min.css'
        ],
        dest   : CB.getPath('src.to.style')
      }
    },

    watch : {
      script : {
        files : CB.getPath('src.to.script', {post: '**/*.js'}),
        tasks : [
          'jshint:js',
          'compile-js'
        ]
      },
      style : {
        files : CB.getPath('src.in.style', {post: '**/*.scss'}),
        tasks : [
          'lesslint',
          'compile-css'
        ]
      }
    }
  });

  require('load-grunt-tasks')(grunt, {scope : 'devDependencies'});
  require('time-grunt')(grunt);

  grunt.registerTask('test', [
    'test-style',
    'test-script'
  ]);

  grunt.registerTask('test-style', [
    'compile-style',
    'lesslint'
  ]);

  grunt.registerTask('test-script', [
    'jshint:script',
    'jscs:script',
    'jshint:grunt',
    'jscs:grunt'
  ]);

  grunt.registerTask('compile-script', [
    'concat',
    'uglify',
    'commonjs',
    'decomment:script',
    'usebanner:script'
  ]);

  grunt.registerTask('compile-style', [
    'scss',
    'autoprefixer',
    'csscomb',
    'cssmin',
    'decomment:style',
    'usebanner:style'
  ]);

  grunt.registerTask('compile', [
    'compile-style',
    'compile-script'
  ]);

  grunt.registerTask('clean', [
    'clean:script',
    'clean:style'
  ]);

  grunt.registerTask('default', [
    'clean',
    'compile'
  ]);

  grunt.registerTask('commonjs', 'Generate CommonJS entrypoint module in dist dir.', commonJsTask);
};

/* EOF */