<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatchController;
use App\Http\Controllers\Api\UserController;  // We'll create this

Route::post('/handshake', [UserController::class, 'handshake']);
Route::post('/catches', [CatchController::class, 'store']);