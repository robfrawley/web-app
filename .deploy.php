<?php

set('repository', 'git@github.com:src-run/web-app.git');
set('shared_file_fixtures', [
    'app/config/parameters.%server_name.yml' => 'app/config/parameters.yml'
]);
