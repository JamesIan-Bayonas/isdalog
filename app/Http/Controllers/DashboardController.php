<?php

namespace App\Http\Controllers;

use App\Models\Bid;
use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === 'buyer') {
            // Query all active listings where this buyer placed at least one bid
            $biddingWatchlist = Listing::where('status', 'active')
                ->whereHas('bids', function ($query) use ($user) {
                    $query->where('buyer_id', $user->id);
                })
                ->with(['bids' => function ($query) {
                    $query->orderByDesc('amount');
                }])
                ->get()
                ->map(function ($listing) use ($user) {
                    $myHighestBid = $listing->bids->where('buyer_id', $user->id)->max('amount');
                    $highestOverallBid = $listing->bids->max('amount') ?? $listing->current_bid;

                    return [
                        'id' => $listing->id,
                        'fish_name' => $listing->fish_name,
                        'weight_kg' => (float) $listing->weight_kg,
                        'location' => $listing->location,
                        'current_bid' => (float) $highestOverallBid,
                        'my_highest_bid' => (float) $myHighestBid,
                        'bid_status' => ((float) $myHighestBid >= (float) $highestOverallBid) ? 'WINNING' : 'OUTBID',
                    ];
                });

            $activeBidsCount = $biddingWatchlist->count();
            $wonConsignmentsCount = DB::table('orders_logistics')
                ->where('user_id', $user->id)
                ->whereIn('status', ['pending_dispatch', 'en_route', 'delivered'])
                ->count();

            return Inertia::render('Dashboard', [
                'biddingWatchlist' => $biddingWatchlist,
                'metrics' => [
                    'active_bids_count' => $activeBidsCount,
                    'won_consignments_count' => $wonConsignmentsCount,
                ],
            ]);
        }

        if ($user->role === 'fisherman') {
            // Retrieve fisherman's active catch listings with eager loaded bids count and highest bid
            $activeListings = Listing::where('user_id', $user->id)
                ->where('status', 'active')
                ->with(['bids'])
                ->get()
                ->map(function ($listing) {
                    $highestBid = $listing->bids->max('amount');
                    $highestBidder = $listing->bids()->orderByDesc('amount')->first();
                    $highestBidderName = $highestBidder && $highestBidder->buyer ? $highestBidder->buyer->name : 'No bidder';

                    return [
                        'id' => $listing->id,
                        'fish_name' => $listing->fish_name,
                        'weight_kg' => (float) $listing->weight_kg,
                        'starting_price' => (float) $listing->starting_price,
                        'current_bid' => (float) ($highestBid ?? $listing->starting_price),
                        'highest_bidder_name' => $highestBidderName,
                        'bids_count' => $listing->bids->count(),
                        'has_bids' => $listing->bids->count() > 0,
                    ];
                });

            // Get Completed and Protected Escrow Logistics History for the Fisherman
            $salesHistory = DB::table('orders_logistics')
                ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
                ->join('users', 'orders_logistics.user_id', '=', 'users.id')
                ->where('orders_logistics.fisherman_id', $user->id)
                ->select(
                    'orders_logistics.id as order_id',
                    'listings.fish_name',
                    'listings.weight_kg',
                    'orders_logistics.final_price',
                    'orders_logistics.final_price as gross_price',
                    DB::raw('(orders_logistics.final_price * 0.03) as platform_fee'),
                    DB::raw('(orders_logistics.final_price * 0.97) as seller_earnings'),
                    DB::raw('(orders_logistics.final_price * 0.97) as net_payout'),
                    'users.name as buyer_name',
                    'orders_logistics.status',
                    'orders_logistics.pickup_otp'
                )
                ->get();

            // Fisherman Metrics Desk
            $walletBalance = (float) $user->wallet_balance;
            $netEarnings = DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->where('status', 'completed')
                ->sum('final_price') * 0.97;

            $pendingEscrow = DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->whereIn('status', ['pending_dispatch', 'en_route', 'delivered'])
                ->sum('final_price');

            $totalWeight = DB::table('catches')
                ->where('user_id', $user->id)
                ->sum('weight');

            $totalCatches = DB::table('catches')
                ->where('user_id', $user->id)
                ->count();

            // Recent activity/telemetry logs
            $recentActivity = DB::table('catches')
                ->where('user_id', $user->id)
                ->orderByDesc('logged_at')
                ->limit(10)
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'species' => $item->species,
                        'weight' => (float) $item->weight,
                        'location' => $item->location,
                        'logged_at' => $item->logged_at,
                    ];
                });

            return Inertia::render('Dashboard', [
                'activeListings' => $activeListings,
                'salesHistory' => $salesHistory,
                'metrics' => [
                    'walletBalance' => $walletBalance,
                    'netEarnings' => $netEarnings,
                    'pendingEscrow' => $pendingEscrow,
                    'totalWeight' => $totalWeight,
                    'totalCatches' => $totalCatches,
                ],
                'recentActivity' => $recentActivity,
            ]);
        }

        return Inertia::render('Dashboard');
    }
}
