<?php // File: isdalog/routes/web.php

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
use App\Http\Controllers\WithdrawalReviewController;
use App\Http\Controllers\WithdrawalPayoutController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', [\App\Http\Controllers\PublicMarketController::class, 'index'])->name('home');
Route::get('/market-preview', [\App\Http\Controllers\PublicMarketController::class, 'index'])->name('market.preview');
Route::middleware(['auth', 'verified'])->group(function () {
    // Terminal & Dashboard State
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::get('/saved-discovery', [\App\Http\Controllers\SavedDiscoveryController::class, 'index'])->name('saved.index');
    Route::put('/saved-discovery/listings/{listing}', [\App\Http\Controllers\SavedDiscoveryController::class, 'favorite'])->name('saved.favorite');
    Route::post('/saved-discovery/searches', [\App\Http\Controllers\SavedDiscoveryController::class, 'saveSearch'])->name('saved.search.store');
    Route::delete('/saved-discovery/searches/{search}', [\App\Http\Controllers\SavedDiscoveryController::class, 'removeSearch'])->whereNumber('search')->name('saved.search.destroy');
    Route::post('/orders/{order}/repeat-inquiry', [\App\Http\Controllers\RepeatInquiryController::class, 'store'])->whereNumber('order')->middleware('throttle:10,1')->name('orders.repeat.store');
    Route::patch('/orders/{order}/repeat-inquiry', [\App\Http\Controllers\RepeatInquiryController::class, 'reply'])->whereNumber('order')->middleware('throttle:10,1')->name('orders.repeat.reply');

    Route::post('/catches', [\App\Http\Controllers\Api\CatchController::class, 'store'])->name('catches.store');
    Route::get('/sell-your-catch', [\App\Http\Controllers\WebCatchController::class, 'create'])->name('catches.create');

    Route::get('/catch-listings/{listing}', [\App\Http\Controllers\CatchDetailController::class, 'show'])->name('catches.show');
    // Bidding, Listings & Harvest Actions
    Route::get('/my-catches', [\App\Http\Controllers\CatchManagementController::class, 'index'])->name('catches.index');
    Route::patch('/listings/{listing}/details', [\App\Http\Controllers\CatchManagementController::class, 'update'])->name('catches.update');
    Route::post('/listings/{listing}/withdraw', [\App\Http\Controllers\CatchManagementController::class, 'withdraw'])->name('catches.withdraw');
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
    Route::post('/listings/{listing}/bids', [BidController::class, 'store'])->name('bids.store');
    Route::post('/listings/{listing}/order', [OrderController::class, 'store'])->name('orders.store');
    Route::post('/listings/{listing}/accept-bid', [ListingController::class, 'acceptBid'])->name('listings.accept-bid');

    Route::get('/orders/{order}/telemetry', [DispatchController::class, 'telemetry'])->middleware('throttle:120,1')->name('orders.telemetry');

    Route::get('/orders', [\App\Http\Controllers\OrderHistoryController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [\App\Http\Controllers\OrderHistoryController::class, 'show'])->whereNumber('order')->name('orders.show');

    Route::post('/orders/{order}/cancel', [\App\Http\Controllers\OrderResolutionController::class, 'cancel'])->middleware('throttle:10,1')->name('orders.cancel');
    Route::post('/orders/{order}/issues', [\App\Http\Controllers\OrderResolutionController::class, 'report'])->middleware('throttle:10,1')->name('orders.issues');
    Route::post('/orders/{order}/review', [\App\Http\Controllers\OrderResolutionController::class, 'review'])->middleware('throttle:10,1')->name('orders.review');
    Route::get('/admin/order-issues', [\App\Http\Controllers\OrderResolutionController::class, 'index'])->name('admin.order-issues');
    Route::patch('/orders/{order}/delivery-details', [\App\Http\Controllers\DeliveryDetailsController::class, 'update'])->middleware('throttle:20,1')->name('orders.delivery-details');
    // Logistics Courier Dispatch Routes
    Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
    Route::post('/dispatch/orders/{order}/claim', [DispatchController::class, 'claim'])->middleware('throttle:10,1')->name('dispatch.claim');
    Route::post('/dispatch/orders/{order}/location', [DispatchController::class, 'updateLocation'])->name('dispatch.location');
    Route::post('/dispatch/orders/{order}/deliver', [DispatchController::class, 'deliver'])->middleware('throttle:10,1')->name('dispatch.deliver');

    // Escrow Clearance & Delivery Handshake Confirmation
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm'])->middleware('throttle:10,1')->name('orders.confirm');

    // Virtual Wallet Escrow Rails
    Route::get('/notifications', [\App\Http\Controllers\WithdrawalNotificationController::class, 'index'])->name('notifications.index');
    Route::patch('/notifications/read-all', [\App\Http\Controllers\WithdrawalNotificationController::class, 'readAll'])->name('notifications.read-all');
    Route::patch('/notifications/{notification}/read', [\App\Http\Controllers\WithdrawalNotificationController::class, 'read'])->whereNumber('notification')->name('notifications.read');
    Route::post('/notifications/{notification}/open', [\App\Http\Controllers\WithdrawalNotificationController::class, 'open'])->whereNumber('notification')->name('notifications.open');
    Route::post('/wallet/deposit', [WalletController::class, 'deposit'])->name('wallet.deposit');
    Route::post('/wallet/withdraw', [WalletController::class, 'withdraw'])->name('wallet.withdraw');

    // BFAR Administration & Compliance Supervision
    Route::get('/admin/withdrawals', [WithdrawalReviewController::class, 'index'])->name('admin.withdrawals.index');
    Route::patch('/admin/withdrawals/{withdrawal}/review', [WithdrawalReviewController::class, 'review'])->name('admin.withdrawals.review');
    Route::post('/admin/withdrawals/{withdrawal}/payout', [WithdrawalPayoutController::class, 'start'])->name('admin.withdrawals.payout');
    Route::post('/admin/withdrawals/{withdrawal}/simulate', [WithdrawalPayoutController::class, 'simulate'])->name('admin.withdrawals.simulate');
    Route::get('/bfar/dashboard', [BfarDashboardController::class, 'index'])->name('bfar.dashboard');
    Route::get('/admin/users', [AdminController::class, 'manageUsers'])->name('admin.users');
    Route::patch('/admin/users/{id}/approve-rider', [AdminController::class, 'approveRider'])->name('admin.users.approve-rider');
    Route::patch('/admin/users/{id}/reject', [AdminController::class, 'rejectUser'])->name('admin.users.reject');
    Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateRole'])->name('admin.users.role');
    Route::patch('/admin/users/{user}/toggle-verification', [AdminController::class, 'toggleVerification'])->name('admin.users.toggle-verification');

    Route::get('/support', [\App\Http\Controllers\SupportController::class, 'index'])->name('support.index');
    Route::post('/support', [\App\Http\Controllers\SupportController::class, 'store'])->middleware('throttle:5,1')->name('support.store');
    Route::patch('/support/{support}', [\App\Http\Controllers\SupportController::class, 'resolve'])->middleware('throttle:20,1')->name('support.resolve');

    Route::get('/admin/vocabulary', [\App\Http\Controllers\VocabularyController::class,'index'])->name('admin.vocabulary');
    Route::post('/admin/vocabulary', [\App\Http\Controllers\VocabularyController::class,'save'])->name('admin.vocabulary.store');
    Route::patch('/admin/vocabulary/{term}', [\App\Http\Controllers\VocabularyController::class,'save'])->whereNumber('term')->name('admin.vocabulary.update');
    Route::post('/admin/vocabulary/{type}/{id}/link', [\App\Http\Controllers\VocabularyController::class,'link'])->whereNumber('id')->name('admin.vocabulary.link');
    // Operator Profile Configuration & Compliance Vetting
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('/profile/upgrade', [ProfileController::class, 'upgradeRole'])->name('profile.upgrade');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/telegram/token', [ProfileController::class, 'generateTelegramLinkToken'])->name('profile.telegram.token');
    Route::delete('/profile/telegram/unlink', [ProfileController::class, 'unlinkTelegramAccount'])->name('profile.telegram.unlink');
});

require __DIR__.'/auth.php';
