<?php

/*
 * This file is part of the `src-run/web-app` project
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

# include the deploy base-recipe
require_once DEPLOY_INC_RECIPE;

# include tasks methods
require_once DEPLOY_INC_TASKS;

# import server list
serverList(DEPLOY_INC_SERVERS);

# default build stage, git remote, releases to keep, composer path, shared files, and env vars
set('default_stage', 'dev-local');
set('repository', 'git@github.com:src-run/web-app.git');
set('keep_releases', 12);
set('composer_command', '/usr/local/bin/composer');
set('shared_files', ['app/config/parameters.yml']);
env('env_vars', 'SYMFONY_ENV={{env}}');
env('console_more', '--no-interaction');
env('composer_options', '--verbose --prefer-dist --no-progress');
env('composer_options_prod', '--no-dev --optimize-autoloader');
env('composer_options_dev', '--dev');
set('assets', ['web/css', 'web/images', 'web/js']);

# define php-fpm task and when to call it (after deploy and rollback)
task('reload:php-fpm', $taskReloadPhpFpm)->desc('Restarting FPM');
after('deploy', 'reload:php-fpm');
after('rollback', 'reload:php-fpm');

# define composer run (deploy:vendors)
task('deploy:vendors', $taskDeployVendors)->desc('Installing vendors');

# define assetic dump
task('deploy:assetic:dump', $taskDeployAsseticDump)->desc('Skipping assetic dump');

# define cache warming task
task('deploy:cache:warmup', $deployCacheWarmup)->desc('Warm up cache');

# define database migration task
task('database:migrate', $databaseMigrate)->desc('Migrate database');

# Run database migrations
//after('deploy:vendors', 'database:migrate');

/* EOF */
