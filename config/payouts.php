<?php

return [
    // Live adapters are unavailable until a provider contract is configured.
    'driver' => env('PAYOUT_DRIVER', 'disabled'),
    'callback_secret' => env('PAYOUT_CALLBACK_SECRET'),
    'callback_tolerance_seconds' => 300,
];
