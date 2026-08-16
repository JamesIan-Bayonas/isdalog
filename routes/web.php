<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DispatchController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WalletController;
use App\Http\Controllers\Api\BfarDashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');

    // Bidding & Order Logistics Actions
    Route::post('/listings/{listing}/bids', [BidController::class, 'store'])->name('bids.store');
    Route::post('/listings/{listing}/order', [OrderController::class, 'store'])->name('orders.store');
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');

    // Logistics Courier Dispatch Routes
    Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
    Route::post('/dispatch/orders/{order}/claim', [DispatchController::class, 'claim'])->name('dispatch.claim');
    Route::post('/dispatch/orders/{order}/location', [DispatchController::class, 'updateLocation'])->name('dispatch.location');
    Route::post('/dispatch/orders/{order}/deliver', [DispatchController::class, 'deliver'])->name('dispatch.deliver');

    // Virtual Wallet Escrow Rails
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->name('wallet.deposit');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])->name('wallet.withdraw');

    // BFAR Administration & Compliance Supervision
    Route::get('/bfar/dashboard', [BfarDashboardController::class, 'index'])->name('bfar.dashboard');
    Route::get('/admin/users', [AdminController::class, 'manageUsers'])->name('admin.users');
    Route::patch('/admin/users/{id}/approve-rider', [AdminController::class, 'approveRider'])->name('admin.users.approve-rider');
    Route::patch('/admin/users/{id}/reject', [AdminController::class, 'rejectUser'])->name('admin.users.reject');
    Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateRole'])->name('admin.users.role');

    // Operator Profile Configuration & Compliance Vetting
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/upgrade', [ProfileController::class, 'upgradeRole'])->name('profile.upgrade');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';