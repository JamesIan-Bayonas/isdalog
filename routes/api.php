<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatchController;
use App\Http\Controllers\Api\ListingController;

// The endpoints your Bot is going to call to log catches and perform the handshake
Route::post('/handshake', [CatchController::class, 'handshake']);
Route::get('/listings', [ListingController::class, 'index']);
Route::post('/catches', [CatchController::class, 'store']); 