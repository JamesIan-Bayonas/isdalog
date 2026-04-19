<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DispatchController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\ListingController;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Auth;
use App\Models\FishCatch;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    $user = Auth::user();

    // 1. Aggregate core metrics
    $totalWeight = FishCatch::where('user_id', $user->id)->sum('weight');
    $totalCatches = FishCatch::where('user_id', $user->id)->count();
    
    // Calculate total value (Assuming you saved estimated_value in the database, 
    // or we can just pass the raw data and calculate it)
    
    // 2. Fetch the 5 most recent catches for the ledger table
    $recentCatches = FishCatch::where('user_id', $user->id)
        ->orderBy('created_at', 'desc')
        ->take(5)
        ->get();

    // 3. Fetch data specifically formatted for the Recharts graph
    $chartData = FishCatch::selectRaw('DATE(created_at) as date, SUM(weight) as daily_weight')
        ->where('user_id', $user->id)
        ->groupBy('date')
        ->orderBy('date', 'asc')
        ->get();

    // Inject data into the React Frontend
    return Inertia::render('Dashboard', [
        'totalWeight' => $totalWeight,
        'totalCatches' => $totalCatches,
        'recentCatches' => $recentCatches,
        'chartData' => $chartData
    ]);
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
    Route::post('/listings/{listing}/bid', [BidController::class, 'store'])->name('bids.store');
    Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');
    Route::post('/listings/{listing}/fulfill', [OrderController::class, 'store'])->name('orders.store');
    Route::get('/dispatch', [DispatchController::class, 'index'])->name('dispatch.index');
    Route::post('/dispatch/{orderId}/accept', [DispatchController::class, 'accept'])->name('dispatch.accept');
    Route::post('/dispatch/{orderId}/delivered', [App\Http\Controllers\DispatchController::class, 'markDelivered'])->name('dispatch.delivered');
    Route::post('/orders/{orderId}/receipt', [App\Http\Controllers\OrderController::class, 'confirmReceipt'])->name('orders.receipt');
    Route::post('/dispatch/{orderId}/delivered', [App\Http\Controllers\DispatchController::class, 'markDelivered'])->name('dispatch.delivered');
    Route::post('/orders/{orderId}/confirm', [App\Http\Controllers\OrderController::class, 'confirmReceipt'])->name('orders.confirm');
});

require __DIR__.'/auth.php';
