<?php

namespace App\Http\Controllers;

use App\Models\FishCatch;
use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // 1. ADMIN ROUTING: Redirect directly to dedicated BFAR supervision gateway
        if ($user->role === 'admin') {
            return redirect()->route('bfar.dashboard');
        }

        // 2. FISHERMAN LOGIC: Harvest metrics, financial earnings ledger, and pickup OTPs
        if ($user->role === 'fisherman') {
            $totalGrossSales = (float) DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->where('status', 'completed')
                ->sum('final_price');

            $netEarnings = round($totalGrossSales * 0.97, 2);
            $totalPlatformFees = round($totalGrossSales * 0.03, 2);

            $pendingEscrowInTransit = (float) DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->whereIn('status', ['pending_dispatch', 'en_route', 'delivered'])
                ->sum('escrow_balance');

            $salesHistory = DB::table('orders_logistics')
                ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
                ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
                ->where('orders_logistics.fisherman_id', $user->id)
                ->select(
                    'orders_logistics.id as order_id',
                    'orders_logistics.final_price',
                    'orders_logistics.pickup_otp',
                    'orders_logistics.status',
                    'orders_logistics.rating',
                    'orders_logistics.created_at',
                    'listings.fish_name',
                    'listings.weight_kg',
                    'buyers.name as buyer_name',
                    'buyers.contact_number as buyer_contact'
                )
                ->orderBy('orders_logistics.created_at', 'desc')
                ->take(10)
                ->get()
                ->map(function ($order) {
                    $net = round($order->final_price * 0.97, 2);
                    $fee = round($order->final_price * 0.03, 2);
                    return [
                        'order_id' => $order->order_id,
                        'fish_name' => $order->fish_name,
                        'weight_kg' => (float) $order->weight_kg,
                        'gross_price' => (float) $order->final_price,
                        'net_payout' => $net,
                        'platform_fee' => $fee,
                        'pickup_otp' => $order->pickup_otp,
                        'status' => $order->status,
                        'rating' => $order->rating,
                        'buyer_name' => $order->buyer_name,
                        'buyer_contact' => $order->buyer_contact,
                        'created_at' => $order->created_at,
                    ];
                });

            return Inertia::render('Dashboard', [
                'role_context' => 'fisherman',
                'metrics' => [
                    'walletBalance' => (float) $user->wallet_balance,
                    'netEarnings' => $netEarnings,
                    'totalGrossSales' => $totalGrossSales,
                    'totalPlatformFees' => $totalPlatformFees,
                    'pendingEscrow' => $pendingEscrowInTransit,
                    'totalWeight' => (float) FishCatch::where('user_id', $user->id)->sum('weight'),
                    'totalCatches' => FishCatch::where('user_id', $user->id)->count(),
                    'activeAuctions' => Listing::where('user_id', $user->id)->where('status', 'active')->count(),
                ],
                'salesHistory' => $salesHistory,
                'recentActivity' => FishCatch::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->take(5)
                    ->get(),
            ]);
        }

        // 3. BUYER / MERCHANT LOGIC: Active bids, delivery OTPs, shipments, and watchlist
        if ($user->role === 'buyer') {
            $activeBidsCount = DB::table('bids')
                ->join('listings', 'bids.listing_id', '=', 'listings.id')
                ->where('bids.buyer_id', $user->id)
                ->where('listings.status', 'active')
                ->distinct('bids.listing_id')
                ->count('bids.listing_id');

            $wonAuctions = DB::table('orders_logistics')
                ->where('user_id', $user->id)
                ->count();

            $escrowLocked = (float) DB::table('orders_logistics')
                ->where('user_id', $user->id)
                ->sum('escrow_balance');

            $activeShipments = DB::table('orders_logistics')
                ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
                ->leftJoin('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
                ->leftJoin('users as riders', 'orders_logistics.rider_id', '=', 'riders.id')
                ->where('orders_logistics.user_id', $user->id)
                ->whereIn('orders_logistics.status', ['pending_dispatch', 'en_route', 'delivered'])
                ->select(
                    'orders_logistics.id as order_id',
                    'orders_logistics.status',
                    'orders_logistics.delivery_otp',
                    'orders_logistics.escrow_balance',
                    'orders_logistics.final_price',
                    'orders_logistics.logistics_type',
                    'orders_logistics.created_at',
                    'listings.fish_name',
                    'listings.weight_kg',
                    'listings.location',
                    'fishermen.name as fisherman_name',
                    'fishermen.contact_number as fisherman_contact',
                    'riders.name as rider_name',
                    'riders.contact_number as rider_contact'
                )
                ->orderBy('orders_logistics.created_at', 'desc')
                ->get();

            // Real-Time Bidding Watchlist Aggregation
            $watchlistRaw = DB::table('bids')
                ->join('listings', 'bids.listing_id', '=', 'listings.id')
                ->where('bids.buyer_id', $user->id)
                ->select(
                    'listings.id as listing_id',
                    'listings.fish_name',
                    'listings.weight_kg',
                    'listings.location',
                    'listings.current_bid',
                    'listings.status as listing_status',
                    'listings.ends_at',
                    DB::raw('MAX(bids.amount) as my_highest_bid'),
                    DB::raw('MAX(bids.created_at) as last_bid_at')
                )
                ->groupBy(
                    'listings.id',
                    'listings.fish_name',
                    'listings.weight_kg',
                    'listings.location',
                    'listings.current_bid',
                    'listings.status',
                    'listings.ends_at'
                )
                ->orderBy('last_bid_at', 'desc')
                ->get();

            $biddingWatchlist = $watchlistRaw->map(function ($item) use ($user) {
                $myBid = (float) $item->my_highest_bid;
                $currentBid = (float) $item->current_bid;

                if ($item->listing_status === 'active') {
                    $status = ($myBid >= $currentBid) ? 'WINNING' : 'OUTBID';
                } else {
                    $wonOrder = DB::table('orders_logistics')
                        ->where('listing_id', $item->listing_id)
                        ->where('user_id', $user->id)
                        ->exists();
                    $status = $wonOrder ? 'WON' : 'CLOSED';
                }

                return [
                    'listing_id' => (int) $item->listing_id,
                    'fish_name' => $item->fish_name,
                    'weight_kg' => (float) $item->weight_kg,
                    'location' => $item->location,
                    'current_bid' => $currentBid,
                    'my_highest_bid' => $myBid,
                    'listing_status' => $item->listing_status,
                    'bid_status' => $status,
                    'ends_at' => $item->ends_at,
                    'last_bid_at' => $item->last_bid_at,
                ];
            });

            return Inertia::render('Dashboard', [
                'role_context' => 'buyer',
                'metrics' => [
                    'activeBids' => $activeBidsCount,
                    'wonAuctions' => $wonAuctions,
                    'walletBalance' => (float) $user->wallet_balance,
                    'escrowLocked' => $escrowLocked,
                ],
                'activeShipments' => $activeShipments,
                'biddingWatchlist' => $biddingWatchlist,
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