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

/**
 * Class UserTaskDefinitions.
 */
class UserTaskDefinitions
{
    /**
     * @param string $method
     * @param string $class
     *
     * @return Closure
     */
    final public static function get($method, $class = 'UserTaskDefinitions')
    {
        if (!in_array($method, get_class_methods($class) ?: [])) {
            return function () use ($method, $class) {
                writeln(sprintf('<comment>[WARNING]</comment> Could not find definition "%s::%s" for task.', $class, $method));
            };
        }

        return function() use ($method, $class) {
            $class::$method();
        };
    }

    # reload FPM configuration task
    static public function servicePhpFpmReload()
    {
        try {
            run('sudo /usr/sbin/service php{{php_fpm_ver}}-fpm reload');
        }
        catch (\Exception $e) {
            writeln('<comment>[WARNING]</comment> Could not reload php-fpm!');
        }
    }

    # restart memcached task
    static public function serviceMemcachedRestart()
    {
        try {
            run('sudo /usr/sbin/service memcached restart');
        }
        catch (\Exception $e) {
            writeln('<comment>[WARNING]</comment> Could not restart memcached!');
        }
    }

    # install/update vendor dependencies
    static public function deployVendors()
    {
        $envVars = env('env_vars') ? 'export ' . env('env_vars') . ' &&' : '';
        $options = env('env') === 'dev' ? env('composer_options_dev') : env('composer_options_prod');
        $action = env('env') === 'dev' ? 'update' : 'install';
        $runFirst = sprintf('cd {{release_path}} && %s {{bin/composer}} %s {{composer_options}} %s {{console_more}}', $envVars, $action, $options);
        $runSecond = sprintf('cd {{release_path}} && %s {{bin/composer}} %s {{composer_options}} %s {{console_more}}', $envVars, 'update', $options);

        try {
            writeln(sprintf('Running composer action: <info>%s</info>', $action));
            run($runFirst);
        } catch (\Exception $e) {
            writeln('Running composer action: <info>update</info> <comment>(fallback attempt)</comment>');
            run($runSecond);
        }
    }

    # dump (compile) bundle assets
    static public function assetDump()
    {
        if (!get('dump_assets')) {
            return;
        }

        run('{{bin/php}} {{release_path}}/' . trim(get('bin_dir'), '/') . '/console assetic:dump --env={{env}} {{console_more}}');
    }

    # warmup symfony cache
    static public function cacheWarmup()
    {
        run('{{bin/php}} {{release_path}}/' . trim(get('bin_dir'), '/') . '/console cache:warmup  --env={{env}} {{console_more}}');
    }

    # migrate database (if available)
    static public function databaseMigrate()
    {
        if (!get('migrate_database')) {
            return;
        }

        run('{{bin/php}} {{release_path}}/' . trim(get('bin_dir'), '/') . '/console doctrine:migrations:migrate --env={{env}} {{console_more}}');
    }

    # deploy fixtures to remote
    static public function deployFixtures()
    {
        if (count($fixtures = get('shared_file_fixtures')) === 0) {
            return;
        }

        writeln(sprintf('Uploading <info>%d</info> fixtures:', count($fixtures)));

        $serverName = @env('server')['name'] ?: '';

        $replaceAnchors = function ($string, array $replacements = []) {
            foreach ($replacements as $search => $replace) {
                $string = str_replace($search, $replace, $string);
            }

            return $string;
        };

        $replaceCollection = [
            '%server_name' => $serverName
        ];

        foreach ($fixtures as $from => $goto) {
            $fromFile = $replaceAnchors($from, $replaceCollection);
            $gotoFile = $replaceAnchors($goto, $replaceCollection);

            if (false === $fromFile = realpath($fromFile)) {
                writeln(sprintf('<comment>[WARNING]</comment> Fixture not found: <info>%s</info>.', $from));
                continue;
            }

            upload($fromFile, $gotoFile);
        }
    }

    /**
     * Clean (remove) extra front-controllers for production deployments
     */
    static public function cleanFrontControllers()
    {
        if (env('env') !== 'prod') {
            return;
        }

        writeln('Cleaning files from <info>{{deploy_path}}/release/web/</info> for <info>prod</info> deployment:');

        writeln('Removing: <info>app_.+\.php</info>');
        run("rm -f {{release_path}}/web/app_*.php");

        writeln('Removing: <info>config.php</info>');
        run("rm -f {{release_path}}/web/config.php");
    }

    /**
     * Deployment ensure-writable paths for web-server writable directories
     */
    static public function deployWritable()
    {
        $preOpts = get('writable_use_sudo') ? 'sudo' : '';
        $webUser = static::getWebUser();

        if (empty($directories = join(' ', get('writable_dirs')))) {
            return;
        }

        try {
            cd('{{release_path}}');

            // osx access rights
            if (null !== $webUser && strpos(run('chmod 2>&1; true'), '+a') !== false) {
                run(sprintf('%s chmod +a "%s allow delete,write,append,file_inherit,directory_inherit" %s', $preOpts, $webUser, $directories));
                run(sprintf('%s chmod +a "`whoami` allow delete,write,append,file_inherit,directory_inherit" %s', $preOpts, $directories));

                return;
            }

            // use posix if no web user is set or no linux acl is available
            if (null === $webUser || !commandExist('setfacl')) {
                run(sprintf('%s chmod 777 -R %s', $preOpts, $directories));

                return;
            }

            // linux acl (using sudo)
            if (!empty($preOpts)) {
                foreach (['u', 'g'] as $type) {
                    run(sprintf('%s setfacl -R -m "%s:%s:rwX" -m "%s:`whoami`:rwX" %s', $preOpts, $type, $webUser, $type, $directories));
                    run(sprintf('%s setfacl -dR -m "%s:%s:rwX" -m "%s:`whoami`:rwX" %s', $preOpts, $type, $webUser, $type, $directories));
                }

                return;
            }

            // linux acl (without sudo, skip any directories that already have acl applies)
            foreach (get('writable_dirs') as $d) {
                // Check if ACL has been set or not
                if (run(sprintf('getfacl -p %s | grep "^user:%s:.*w" | wc -l', $d, $webUser))->toString()) {
                    continue;
                }

                // Set ACL for directory if it has not been set before
                foreach (['u', 'g'] as $type) {
                    run(sprintf('setfacl -R -m "%s:%s:rwX" -m "%s:`whoami`:rwX" %s', $type, $webUser, $type, $d));
                    run(sprintf('setfacl -dR -m "%s:%s:rwX" -m "%s:`whoami`:rwX" %s', $type, $webUser, $type, $d));
                }
            }
        }
        catch (\RuntimeException $e) {
            $formatter = \Deployer\Deployer::get()->getHelper('formatter');
            $errorMessage = [
                "Unable to setup correct permissions for writable dirs.                  ",
                "You need to configure sudo's sudoers files to not prompt for password,",
                "or setup correct permissions manually.                                  ",
            ];
            write($formatter->formatBlock($errorMessage, 'error', true));

            throw $e;
        }
    }

    /**
     * Output current release
     */
    static public function releaseCurrent()
    {
        writeln('Current release: ' . basename(env('current')));
    }

    /**
     * Display listing of releases
     */
    static public function releaseListing()
    {
        writeln('Release listing:');

        foreach (env('releases_list') as $i => $r) {
            writeln(sprintf(" [<comment>%d</comment>] <info>%s</info> (%s)", $i, $r, realpath(sprintf('%s/releases/%s', env('deploy_path'), $r))));
        }
    }

    /**
     * Perform rollback previous release
     */
    static public function releaseRollback()
    {
        $releases = env('releases_list');

        if (!isset($releases[1])) {
            writeln("<comment>No release to revert to!</comment>");

            return;
        }

        $releaseDir = "{{deploy_path}}/releases/{$releases[1]}";
        run("cd {{deploy_path}} && ln -nfs $releaseDir current");

        writeln(sprintf('Removing release <info>%s</info>.', $releases[0]));
        run("rm -rf {{deploy_path}}/releases/{$releases[0]}");

        writeln(sprintf('Now on release <info>%s</info>.', $releases[1]));
    }

    /**
     * @return null|string
     */
    static private function getWebUser()
    {
        if (null !== ($webUser = get('http_user'))) {
            return $webUser;
        }

        if (null !== ($webUser = env('http_user'))) {
            return $webUser;
        }

        $webUser = run('ps axo user,comm | grep -E \'[a]pache|[h]ttpd|[_]www|[w]ww-data|[n]ginx\' | grep -v root | head -1 | cut -d\  -f1')->toString();

        return empty($webUser) ? null : $webUser;
    }
}

/* EOF */
