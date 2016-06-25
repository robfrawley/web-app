
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
    var configPath;
    var configTask;

    // Import requirements.
    path = require('path');
    fs = require('fs');

    // Parse config json.
    configJson = grunt.file.readJSON('./.grunt/config.json', {
        encoding: 'utf8'}
    );

    // Get config path value.
    configPath = function (index, post, pre) {
        var c = configJson.paths;

        index.split('.').forEach(function (key) {
            c = c[key];
        });

        if (pre) {
            c = pre + c;
        }

        return post ? c + post : c;
    };

    // Get config task value.
    configTask = function (index, post) {
        var c = configJson.tasks;

        index.split('.').forEach(function (key) {
            c = c[key];
        });

        return post ? c + post : c;
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
            core : {
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
            core : {
                src : '<%= jshint.core.src %>'
            }
        },

        // Dist comments removal.
        decomment : {
            dist : {
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
            dist : {
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
            bootstrap : {
                src : [
                    configPath('bootstrap.js', 'transition.js'),
                    configPath('bootstrap.js', 'alert.js'),
                    configPath('bootstrap.js', 'button.js'),
                    configPath('bootstrap.js', 'carousel.js'),
                    configPath('bootstrap.js', 'collapse.js'),
                    configPath('bootstrap.js', 'dropdown.js'),
                    configPath('bootstrap.js', 'modal.js'),
                    configPath('bootstrap.js', 'tooltip.js'),
                    configPath('bootstrap.js', 'popover.js'),
                    configPath('bootstrap.js', 'scrollspy.js'),
                    configPath('bootstrap.js', 'tab.js'),
                    configPath('bootstrap.js', 'affix.js')
                ],
                dest : configPath('dist.js', '<%= pkg.name %>.js')
            }
        },

        // Css uglify task config.
        uglify : {
            options : {
                mangle           : true,
                preserveComments : false,
                screwIE8         : true,
                quoteStyle       : 2
            },
            core : {
                src  : '<%= concat.bootstrap.dest %>',
                dest : configPath('dist.js', '<%= pkg.name %>.min.js')
            }
        },

        // Less compilation task config.
        less : {
            compileCore : {
                options : {
                    strictMath        : true,
                    sourceMap         : true,
                    outputSourceFiles : true,
                    sourceMapURL      : '<%= pkg.name %>.css.map',
                    sourceMapFilename : configPath('dist.less', '<%= pkg.name %>.css.map')
                },
                src  : configPath('src.less', '<%= pkg.name %>.less'),
                dest : configPath('dist.less', '<%= pkg.name %>.css')
            },
            compileTheme : {
                options : {
                    strictMath        : true,
                    sourceMap         : true,
                    outputSourceFiles : true,
                    sourceMapURL      : '<%= pkg.name %>-theme.css.map',
                    sourceMapFilename : configPath('dist.less', '<%= pkg.name %>-theme.css.map')
                },
                src  : configPath('src.less', '<%= pkg.name %>-theme.less'),
                dest : configPath('dist.less', '<%= pkg.name %>-theme.css')
            }
        },

        // AutoPrefixer task config.
        autoprefixer : {
            options : {
                browsers : configTask('autoprefixer.browserList')
            },
            core: {
                options : {
                    map : true
                },
                src : configPath('dist.less', '<%= pkg.name %>.css')
            },
            theme : {
                options : {
                    map : true
                },
                src : configPath('dist.less', '<%= pkg.name %>-theme.css')
            }
        },

        // Csslint task config.
        csslint : {
            options : {
                csslintrc : configPath('src.less', '.csslintrc')
            },
            dist : [
                configPath('dist.less', '<%= pkg.name %>.css'),
                configPath('dist.less', '<%= pkg.name %>-theme.css')
            ]
        },

        // Cssmin task config.
        cssmin : {
            options : {
                compatibility       : false,
                keepSpecialComments : false,
                sourceMap           : true,
                advanced            : false
            },
            minifyCore : {
                src  : configPath('dist.less', '<%= pkg.name %>.css'),
                dest : configPath('dist.less', '<%= pkg.name %>.min.css')
            },
            minifyTheme: {
                src  : configPath('dist.less', '<%= pkg.name %>-theme.css'),
                dest : configPath('dist.less', '<%= pkg.name %>-theme.min.css')
            }
        },

        // Csscomb task config.
        csscomb : {
            options : {
                config : configPath('src.less', '.csscomb.json')
            },
            dist: {
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
            src : {
                files : '<%= jshint.core.src %>',
                tasks : [
                    'jshint:core',
                    'concat'
                ]
            },
            test : {
                files : '<%= jshint.test.src %>',
                tasks : [
                    'jshint:test'
                ]
            },
            less: {
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
        'dist-css',
        'dist-js',
        'csslint:dist',
        'test-js'
    ]);
    grunt.registerTask('test-js', [
        'jshint:core',
        'jshint:test',
        'jshint:grunt',
        'jscs:core',
        'jscs:test',
        'jscs:grunt',
        'qunit'
    ]);

    // JS distribution task.
    grunt.registerTask('dist-js', [
        'concat',
        'uglify:core',
        'commonjs'
    ]);

    // CSS distribution task.
    grunt.registerTask('less-compile', [
        'less:compileCore',
        'less:compileTheme'
    ]);
    grunt.registerTask('dist-css', [
        'less-compile',
        'autoprefixer:core',
        'autoprefixer:theme',
        'csscomb:dist',
        'cssmin:minifyCore',
        'cssmin:minifyTheme'
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
        cjs(grunt, grunt.config.get('concat.bootstrap.src'), configPath('dist.js', 'npm.js'));
    });
};

/* EOF */
