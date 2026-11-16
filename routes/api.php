<?php // File: isdalog/routes/api.php

use App\Http\Controllers\Api\CatchController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\DispatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Authenticated IsdaLog simulator events; a live provider needs its own verified adapter.
Route::post('/payouts/callback', [\App\Http\Controllers\WithdrawalPayoutController::class, 'callback'])->middleware('throttle:30,1');

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Telegram API Handshakes & Deep Linking
Route::post('/telegram/handshake', [UserController::class, 'handshake'])->middleware([\App\Http\Middleware\AuthenticateBot::class, 'throttle:30,1']);
Route::post('/telegram/link', [UserController::class, 'linkTelegramAccount'])->middleware([\App\Http\Middleware\AuthenticateBot::class, 'throttle:30,1']);

// Catches & Listings
Route::post('/catches', [CatchController::class, 'store'])->middleware([\App\Http\Middleware\AuthenticateBot::class, 'throttle:30,1']);
Route::get('/listings', [ListingController::class, 'index']);

// Courier Logistics & Dispatch Handshakes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/dispatch/orders/{order}/claim', [DispatchController::class, 'claim'])->middleware('throttle:10,1');
    Route::post('/dispatch/orders/{order}/deliver', [DispatchController::class, 'deliver'])->middleware('throttle:10,1');
    Route::post('/dispatch/orders/{order}/location', [DispatchController::class, 'updateLocation']);
});
