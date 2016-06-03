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
    if (!askConfirmation('Restart PHP-FPM?', true)) {
        return;
    }

    writeln(sprintf('Selected <info>php%s-fpm</info> service', get('php_fpm_ver')));
};

$taskDeployVendors = function () {
    $composer = env('bin/composer');
    $envVars = env('env_vars') ? 'export ' . env('env_vars') . ' &&' : '';
    $moreOptions = env('env') === 'dev' ? env('composer_options_dev') : env('composer_options_prod');
    $action = env('env') === 'dev' ? 'update' : 'install';

    run("cd {{release_path}} && $envVars $composer $action {{composer_options}} $moreOptions");
};

$taskDeployAsseticDump = function() {
    /* overwrite with empty closure to disable */
};

/* EOG */
