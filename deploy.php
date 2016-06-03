<?php

/*
 * This file is part of the `src-run/web-app` project
 *
 * (c) Rob Frawley 2nd <rmf@src.run>
 *
 * For the full copyright and license information, please view the LICENSE.md
 * file that was distributed with this source code.
 */

# define path to the REAL deplay php file
define('DEPLOY_INC_CONFIG', __DIR__ . '/.deploy/config.php');

# define path to custom task method implementations
define('DEPLOY_INC_TASKS', __DIR__ . '/.deploy/tasks.php');

# define path to yaml server list configuration
define('DEPLOY_INC_SERVERS', __DIR__ . '/.deploy/servers.yml');

# define path to the base recipe to build off of
define('DEPLOY_INC_RECIPE', __DIR__ . '/vendor/deployer/deployer/recipe/symfony3.php');

# define path to composer autoloader
define('COMPOSER_INC_AUTOLOAD', __DIR__ . '/vendor/autoload.php');

/**
 * @param string $filePath
 */
function requireDeployInclude($filePath)
{
    if (!file_exists($filePath)) {
        fwrite(STDERR, sprintf('Could not locate required deploy file include: %s.', $filePath));
        exit (255);
    }

    require_once $filePath;
}

# include deploy configuration root
requireDeployInclude(DEPLOY_INC_CONFIG);

/* EOF */
