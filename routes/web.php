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

    Route::post('/dispatch/verify', [DispatchController::class, 'submitVerification'])->name('dispatch.verify.submit');

    // =========================================================================
    // 📊 OPTIMIZED DEFENSE DASHBOARD ENGINE
    // Automatically switches view data context based on user authorization roles
    // =========================================================================
    Route::get('/dashboard', function () {
        $user = Auth::user();

        // If an Administrator logs in, show them GLOBAL system data metrics
        if ($user->role === 'admin' || $user->role === 'superuser') {
            return Inertia::render('Dashboard', [
                'totalWeight' => FishCatch::sum('weight') ?? 385, // Fallback placeholder if table is fresh
                'totalCatches' => FishCatch::count() ?: 14,
                'recentCatches' => FishCatch::orderBy('created_at', 'desc')->take(5)->get()->toArray() ?: [
                    ['id' => 1, 'species' => 'Tilapia', 'weight' => 15, 'created_at' => now()->subMinutes(2)->toDateTimeString()],
                    ['id' => 2, 'species' => 'Lapu-Lapu', 'weight' => 22, 'created_at' => now()->subMinutes(12)->toDateTimeString()],
                    ['id' => 3, 'species' => 'Bangus', 'weight' => 8, 'created_at' => now()->subHour()->toDateTimeString()],
                ],
                'chartData' => FishCatch::selectRaw('DATE(created_at) as date, SUM(weight) as daily_weight')->groupBy('date')->get(),
            ]);
        }

        // Standard context fallback tracking for regular individual Fishermen accounts
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
    // TEMPORARY PROTOTYPE ALLOWANCE: Grants 'buyer' access for seamless live demo switching
    // =========================================================================
    Route::group(['middleware' => function ($request, $next) {
        $user = $request->user();
        if ($user && ($user->role === 'rider' || $user->role === 'buyer')) {
            return $next($request);
        }
        abort(403, 'Access Denied: Your account role is not authorized to access the rider platform.');
    }], function () {
        Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
        Route::post('/dispatch/{id}/claim', [DispatchController::class, 'claim'])->name('dispatch.claim');
        Route::post('/dispatch/{id}/complete', [DispatchController::class, 'completeDelivery'])->name('dispatch.complete');
        Route::post('/dispatch/verify', [DispatchController::class, 'submitVerification'])->name('dispatch.verify.submit');
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
    Route::patch('/admin/users/{id}/approve-rider', [AdminController::class, 'approveRider'])->name('admin.users.approve-rider');
    Route::patch('/admin/users/{id}/reject', [AdminController::class, 'rejectUser'])->name('admin.users.reject');
});

require __DIR__.'/auth.php';