<?php

use App\Http\Controllers\Api\BfarDashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DispatchController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Models\FishCatch;
use Inertia\Inertia;

// --- PUBLIC ROUTES ---
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// --- AUTHENTICATED ROUTES ---
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('/dashboard', function () {
        $user = Auth::user();
        return Inertia::render('Dashboard', [
            'totalWeight' => FishCatch::where('user_id', $user->id)->sum('weight'),
            'totalCatches' => FishCatch::where('user_id', $user->id)->count(),
            'recentCatches' => FishCatch::where('user_id', $user->id)->orderBy('created_at', 'desc')->take(5)->get(),
            'chartData' => FishCatch::selectRaw('DATE(created_at) as date, SUM(weight) as daily_weight')->where('user_id', $user->id)->groupBy('date')->get(),
        ]);
    })->name('dashboard');

    // Profile Management
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Marketplace & Bidding
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
    Route::post('/listings/{listing}/bid', [BidController::class, 'store'])->name('bids.store');
    Route::post('/orders/{listing}', [OrderController::class, 'store'])->name('orders.store');

    // =========================================================================
    // ENHANCED DISPATCH LOGISTICS LAYER (Bypasses traditional provider Gates)
    // =========================================================================
    Route::group(['middleware' => function ($request, $next) {
        if ($request->user() && $request->user()->role === 'rider') {
            return $next($request);
        }
        abort(403, 'Access Denied: Your account role is not authorized to access the rider platform.');
    }], function () {
        Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
        Route::post('/dispatch/{id}/claim', [DispatchController::class, 'claim'])->name('dispatch.claim');
        Route::post('/dispatch/{id}/complete', [DispatchController::class, 'completeDelivery'])->name('dispatch.complete');
    });

    // =========================================================================
    // ENHANCED BFAR REGULATORY LAYER (Bypasses traditional provider Gates)
    // =========================================================================
    Route::group(['middleware' => function ($request, $next) {
        if ($request->user() && $request->user()->role === 'admin') {
            return $next($request);
        }
        abort(403, 'Access Denied: This dashboard is reserved for BFAR/LGU management officials.');
    }], function () {
        Route::get('/bfar/dashboard', [BfarDashboardController::class, 'index'])->name('bfar.dashboard');
    });

    // Admin User Management
    Route::get('/admin/users', [AdminController::class, 'manageUsers'])->name('admin.users');
    Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateRole'])->name('admin.users.update');
});

require __DIR__.'/auth.php';