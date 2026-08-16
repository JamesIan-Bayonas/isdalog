<?php

namespace App\Http\Controllers;

use App\Models\FishCatch;
use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. ADMIN ROUTING: Redirect directly to the dedicated BFAR supervision gateway
        if ($user->role === 'admin') {
            return redirect()->route('bfar.dashboard');
        }

        // 2. FISHERMAN LOGIC: Harvest volume and active catch auction metrics
        if ($user->role === 'fisherman') {
            return Inertia::render('Dashboard', [
                'role_context' => 'fisherman',
                'metrics' => [
                    'totalWeight' => (float) FishCatch::where('user_id', $user->id)->sum('weight'),
                    'totalCatches' => FishCatch::where('user_id', $user->id)->count(),
                    'activeAuctions' => Listing::where('user_id', $user->id)->where('status', 'active')->count(),
                ],
                'recentActivity' => FishCatch::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get(),
            ]);
        }

        // 3. BUYER / MERCHANT LOGIC: Active consignment bids, orders, and wallet balance
        if ($user->role === 'buyer') {
            $activeBidsCount = DB::table('bids')->where('buyer_id', $user->id)->count();
            $wonAuctions = DB::table('orders_logistics')->where('user_id', $user->id)->count();

            return Inertia::render('Dashboard', [
                'role_context' => 'buyer',
                'metrics' => [
                    'activeBids' => $activeBidsCount,
                    'wonAuctions' => $wonAuctions,
                    'walletBalance' => (float) $user->wallet_balance,
                ],
                'recentActivity' => DB::table('bids')
                    ->join('listings', 'bids.listing_id', '=', 'listings.id')
                    ->where('bids.buyer_id', $user->id)
                    ->select('listings.fish_name', 'bids.amount', 'bids.created_at')
                    ->orderBy('bids.created_at', 'desc')
                    ->take(5)
                    ->get(),
            ]);
        }

        // 4. RIDER LOGIC: Logistics fulfillment and harbor cargo dispatch metrics
        if ($user->role === 'rider') {
            $completedDeliveries = DB::table('orders_logistics')
                ->where('rider_id', $user->id)
                ->where('status', 'completed')
                ->count();

            return Inertia::render('Dashboard', [
                'role_context' => 'rider',
                'metrics' => [
                    'completedDeliveries' => $completedDeliveries,
                    'pendingDispatch' => DB::table('orders_logistics')
                        ->where('status', 'pending_dispatch')
                        ->count(),
                ],
                'recentActivity' => [],
            ]);
        }

        // 5. DEFENSIVE FALLBACK: Prevent untyped role access
        abort(403, 'Unauthorized Ecosystem Role.');
    }
}