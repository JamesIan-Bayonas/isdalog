<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\Api\BfarDashboardController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DispatchController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});
Route::middleware(['auth', 'verified'])->group(function () {
    // Terminal & Dashboard State
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');

    // Bidding, Listings & Harvest Actions
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
    Route::post('/listings/{listing}/bids', [BidController::class, 'store'])->name('bids.store');
    Route::post('/listings/{listing}/order', [OrderController::class, 'store'])->name('orders.store');
    Route::post('/listings/{listing}/accept-bid', [ListingController::class, 'acceptBid'])->name('listings.accept-bid');

    // Logistics Courier Dispatch Routes
    Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
    Route::post('/dispatch/orders/{order}/claim', [DispatchController::class, 'claim'])->name('dispatch.claim');
    Route::post('/dispatch/orders/{order}/location', [DispatchController::class, 'updateLocation'])->name('dispatch.location');
    Route::post('/dispatch/orders/{order}/deliver', [DispatchController::class, 'deliver'])->name('dispatch.deliver');

    // Escrow Clearance & Delivery Handshake Confirmation
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');

    // Virtual Wallet Escrow Rails
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->name('wallet.deposit');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])->name('wallet.withdraw');

    // BFAR Administration & Compliance Supervision
    Route::get('/bfar/dashboard', [BfarDashboardController::class, 'index'])->name('bfar.dashboard');
    Route::get('/admin/users', [AdminController::class, 'manageUsers'])->name('admin.users');
    Route::patch('/admin/users/{id}/approve-rider', [AdminController::class, 'approveRider'])->name('admin.users.approve-rider');
    Route::patch('/admin/users/{id}/reject', [AdminController::class, 'rejectUser'])->name('admin.users.reject');
    Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateRole'])->name('admin.users.role');
    Route::patch('/admin/users/{user}/toggle-verification', [AdminController::class, 'toggleVerification'])->name('admin.users.toggle-verification');

    // Operator Profile Configuration & Compliance Vetting
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/upgrade', [ProfileController::class, 'upgradeRole'])->name('profile.upgrade');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/telegram/token', [ProfileController::class, 'generateTelegramLinkToken'])->name('profile.telegram.token');
    Route::delete('/profile/telegram/unlink', [ProfileController::class, 'unlinkTelegramAccount'])->name('profile.telegram.unlink');
});

require __DIR__.'/auth.php';