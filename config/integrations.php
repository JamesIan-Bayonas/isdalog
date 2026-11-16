<?php // File: isdalog/config/integrations.php

return [
    'funding_driver' => env('FUNDING_DRIVER', in_array(env('APP_ENV'), ['local', 'testing'], true) ? 'demo' : 'disabled'),
    'sms_driver' => env('SMS_DRIVER', in_array(env('APP_ENV'), ['local', 'testing'], true) ? 'log' : 'disabled'),
];
