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

$taskReloadPhpFpm = function () {
    run('sudo /usr/sbin/service php{{php_fpm_ver}}-fpm reload');
};

$taskDeployVendors = function () {
    $envVars = env('env_vars') ? 'export ' . env('env_vars') . ' &&' : '';
    $options = env('env') === 'dev' ? env('composer_options_dev') : env('composer_options_prod');
    $action = env('env') === 'dev' ? 'update' : 'install';

    run(sprintf('cd {{release_path}} && %s {{bin/composer}} %s {{composer_options}} %s {{console_more}}', $envVars, $action, $options));
};

$taskDeployAsseticDump = function() {
    /* overwrite with empty closure to disable */
};

$deployCacheWarmup = function () {
    run('{{bin/php}} {{release_path}}/' . trim(get('bin_dir'), '/') . '/console cache:warmup  --env={{env}} {{console_more}}');
};

$databaseMigrate = function () {
    run('{{bin/php}} {{release_path}}/' . trim(get('bin_dir'), '/') . '/console doctrine:migrations:migrate --env={{env}} {{console_more}}');
};

/* EOG */
