<?php

use App\Http\Controllers\Api\CatchController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\DispatchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Telegram API Handshakes & Deep Linking
Route::post('/telegram/handshake', [UserController::class, 'handshake']);
Route::post('/telegram/link', [UserController::class, 'linkTelegramAccount']);

// Catches & Listings
Route::post('/catches', [CatchController::class, 'store']);
Route::get('/listings', [ListingController::class, 'index']);

// Courier Logistics & Dispatch Handshakes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/dispatch/orders/{order}/claim', [DispatchController::class, 'claim']);
    Route::post('/dispatch/orders/{order}/deliver', [DispatchController::class, 'deliver']);
    Route::post('/dispatch/orders/{order}/location', [DispatchController::class, 'updateLocation']);
});