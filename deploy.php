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
define('DEPLOY_INC_REAL', __DIR__.'/.deploy/deploy.php');

# define path to custom task method implementations
define('DEPLOY_INC_TASKS', __DIR__.'/.deploy/deploy-tasks.php');

# define path to yaml server list configuration
define('DEPLOY_INC_SERVERS', __DIR__ . '/.deploy/deploy-servers.yml');

# define path to the base recipe to build off of
define('DEPLOY_INC_RECIPE', __DIR__ . '/vendor/deployer/deployer/recipe/symfony3.php');

/**
 * @param string  $message
 * @param mixed[] ...$replacements
 */
function writeEr($message, ...$replacements)
{
    fwrite(STDERR, sprintf($message, ...$replacements));
    exit (255);
}

if (!file_exists(DEPLOY_INC_REAL)) {
    writeEr('Could not locate the REAL deploy PHP file. Expected to find it at "%s".', DEPLOY_INC_REAL);
}

require_once DEPLOY_INC_REAL;

/* EOF */
