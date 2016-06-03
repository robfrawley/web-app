<?php

/*
 * This file is part of the `src-run/web-app` project
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

# include the composer auto-loader
requireDeployInclude(COMPOSER_INC_AUTOLOAD);

# include the composer auto-loader
requireDeployInclude(DEPLOY_INC_RECIPE);

# include the composer auto-loader
requireDeployInclude(DEPLOY_INC_TASKS);

# import server list
serverList(DEPLOY_INC_SERVERS);

# default build stage, git remote, releases to keep, composer path, shared files, and env vars
set('default_stage', 'dev-local');
set('repository', 'git@github.com:src-run/web-app.git');
set('keep_releases', 12);
set('composer_command', '/usr/local/bin/composer');
set('shared_files', ['app/config/parameters.yml']);
set('ssh_type', 'ext-ssh2');
set('assets', ['web/css', 'web/images', 'web/js']);
set('dump_assets', false);
set('migrate_database', false);
set('shared_file_fixtures', [
    __DIR__.'/../app/config/parameters.%server_name.yml' => '{{deploy_path}}/shared/app/config/parameters.yml'
]);
env('env_vars', 'SYMFONY_ENV={{env}}');
env('console_more', '--no-interaction');
env('composer_options', '--verbose --prefer-dist --no-progress');
env('composer_options_prod', '--no-dev --optimize-autoloader');
env('composer_options_dev', '--dev');

# define php-fpm task and when to call it (after deploy and rollback)
task('service:php-fpm:reload', UserTaskDefinitions::get('servicePhpFpmReload'))
    ->desc('Reload php-fpm');

# define memcached task and when to call it (after deploy and rollback)
task('service:memcached:restart', UserTaskDefinitions::get('serviceMemcachedRestart'))
    ->desc('Restart memcached');

# define composer run (deploy:vendors)
task('deploy:vendors', UserTaskDefinitions::get('deployVendors'))
    ->desc('Installing vendors');

# define assetic dump
task('deploy:assetic:dump', UserTaskDefinitions::get('assetDump'))
    ->desc('Assetic dump');

# define cache warming task
task('deploy:cache:warmup', UserTaskDefinitions::get('cacheWarmup'))
    ->desc('Warm up cache');

# define database migration task
task('database:migrate', UserTaskDefinitions::get('databaseMigrate'))
    ->desc('Migrate database');

# define clear extra front-controllers task
task('deploy:clear_controllers', UserTaskDefinitions::get('cleanFrontControllers'))
    ->desc('Clear extra front-controllers')
    ->isPrivate();

# define shared fixtures task
task('deploy:shared:fixtures', UserTaskDefinitions::get('deployFixtures'))
    ->desc('Deploying shared fixtures');

# define writable deploy task
task('deploy:writable', UserTaskDefinitions::get('deployWritable'))
    ->desc('Make writable dirs')
    ->setPrivate();

# define task to show current release
task('release:current', UserTaskDefinitions::get('releaseCurrent'))
    ->desc('Show current release.');

# define task to list releases
task('release:list', UserTaskDefinitions::get('releaseListing'))
    ->desc('Show release listing.');

# rollback to previous release
task('release:rollback', UserTaskDefinitions::get('releaseRollback'))
    ->desc('Back to previous release.');

task('release:deploy', function() {})
    ->desc('Push new release.');

# assign when new tasks are called in pre-existing chain
after('release:deploy', 'deploy');
after('deploy', 'service:php-fpm:reload');
after('deploy', 'service:memcached:restart');
after('rollback', 'service:php-fpm:reload');
after('deploy:vendors', 'database:migrate');
after('deploy:shared', 'deploy:shared:fixtures');

/* EOF */
