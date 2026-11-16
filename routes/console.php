<?php // File: isdalog/routes/console.php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Artisan::command('auctions:expire', function () {
    $count = app(\App\Services\AuctionExpiry::class)->run();
    $this->info('Expired '.$count.' auction(s). No funds moved.');
})->purpose('Record expired auctions without awarding offers or moving funds');

\Illuminate\Support\Facades\Schedule::command('auctions:expire')->everyMinute()->withoutOverlapping();
