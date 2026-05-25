<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CatchController;
use App\Http\Controllers\Api\ListingController;
use App\Http\Controllers\Api\BfarDashboardController;
use App\Http\Controllers\DeliveryController; // 💡 Injected for the rider path

// ============================================================================
// 1. YOUR EXISTING WORKING ENDPOINTS (Leave these exactly as they are)
// ============================================================================
Route::get('/bfar/analytics', [BfarDashboardController::class, 'getAnalytics']);
Route::post('/handshake', [CatchController::class, 'handshake']);
Route::get('/listings', [ListingController::class, 'index']);
Route::post('/catches', [CatchController::class, 'store']); 

// ============================================================================
// 2. THE NEW FUTURE-PROOF SECURITY GATES (Paste this at the very bottom)
// This is the code that tells the bouncer to block unverified riders
// ============================================================================
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Future Rider Secure Contracts Cluster
    Route::prefix('logistics')->group(function () {
        
        // Stage 1 Placeholder: Only verified riders can view available cargo contracts
        Route::get('/jobs', [DeliveryController::class, 'availableJobs']);
        
        // Stage 2 Placeholder: The Port Handshake (Requires QR confirmation logic later)
        Route::post('/claim-cargo/{id}', [DeliveryController::class, 'claimCargo']);
    });
    
});