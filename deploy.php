<?php

/*
 * This file is part of the `src-run/web-app` project
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

require 'recipe/symfony3.php';

// Default stage to build
//set('default_stage', 'staging');

// Import server definitions
serverList(__DIR__.'/.deploy-servers.yml');

// Repository to pull from
set('repository', 'git@github.com:src-run/web-app.git');

// Define task to reload PHP-FPM server
task('reload:php-fpm', function () {
    run('sudo /usr/sbin/service php5-fpm reload');
});

// After the deploy stage, reload call PHP-FPM reload task
after('deploy', 'reload:php-fpm');

// Symfony shared files/dir and writable dirs
set('shared_files', ['app/config/parameters.yml']);
set('shared_dirs', ['app/logs']);
set('writable_dirs', ['var/cache', 'var/logs', 'var/sessions']);

// Assets
//set('assets', ['web/css', 'web/images', 'web/js']);
task('deploy:assetic:dump', function() {

});

// Webserver user
set('http_user', 'rmf');

// Path to composer executable
set('composer_command', '/usr/local/bin/composer');

// Keep 12 releases in history
set('keep_releases', 12);

// Environment vars
env('env_vars', 'SYMFONY_ENV=prod');
env('env', 'prod');

// Run DB migrations after deploying vendors
//after('deploy:vendors', 'database:migrate');

/* EOF */
