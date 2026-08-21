<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Route dashboard rendering based on the authenticated operator role.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        if ($user->role === 'fisherman') {
            return $this->renderFishermanDashboard($user);
        }

        if ($user->role === 'rider') {
            return $this->renderRiderDashboard($user);
        }

        if ($user->role === 'admin') {
            return $this->renderAdminDashboard($user);
        }

        return $this->renderBuyerDashboard($user);
    }

    /**
     * Aggregate consignment ledger, active auctions, telemetry logs, and stats for Harvester role.
     */
    private function renderFishermanDashboard(User $user): Response
    {
        // 1. Compute Harvester Financial & Biomass Metrics
        $lifetimeNetEarnings = round(
            (float) DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->where('status', 'completed')
                ->sum('final_price') * 0.97,
            2
        );

        $escrowInTransit = round(
            (float) DB::table('orders_logistics')
                ->where('fisherman_id', $user->id)
                ->whereIn('status', ['pending_dispatch', 'en_route', 'delivered'])
                ->sum('final_price') * 0.97,
            2
        );

        $loggedBiomass = (float) DB::table('catches')
            ->where('user_id', $user->id)
            ->sum('weight');

        if ($loggedBiomass == 0) {
            $loggedBiomass = (float) DB::table('listings')
                ->where('user_id', $user->id)
                ->sum('weight_kg');
        }

        $totalBatches = DB::table('catches')
            ->where('user_id', $user->id)
            ->count();

        // 2. Active Auctions & Bidding Status
        $activeAuctions = DB::table('listings')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($listing) {
                $highestBid = DB::table('bids')
                    ->join('users', 'bids.buyer_id', '=', 'users.id')
                    ->where('bids.listing_id', $listing->id)
                    ->select('bids.*', 'users.name as buyer_name')
                    ->orderByDesc('bids.amount')
                    ->first();

                $listing->bids_count = DB::table('bids')->where('listing_id', $listing->id)->count();
                $listing->highest_bid = $highestBid ? (float) $highestBid->amount : (float) $listing->starting_price;
                $listing->leading_bidder = $highestBid ? $highestBid->buyer_name : null;
                return $listing;
            });

        // 3. Consignment Sales & Escrow Ledger (Contains Handshake Pickup OTP PIN)
        $consignmentLedger = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->leftJoin('users as riders', 'orders_logistics.rider_id', '=', 'riders.id')
            ->where('orders_logistics.fisherman_id', $user->id)
            ->select([
                'orders_logistics.id as order_id',
                'orders_logistics.id',
                'listings.id as listing_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price',
                'orders_logistics.escrow_balance',
                'orders_logistics.delivery_fee',
                'orders_logistics.status',
                'orders_logistics.pickup_otp',   // Crucial: Handshake Pickup Token PIN for Rider
                'orders_logistics.delivery_otp',
                'orders_logistics.logistics_type',
                'orders_logistics.rating',
                'buyers.name as buyer_name',
                'buyers.contact_number as buyer_contact',
                'riders.name as rider_name',
                'riders.contact_number as rider_contact',
                'orders_logistics.created_at',
                'orders_logistics.updated_at',
            ])
            ->orderByDesc('orders_logistics.created_at')
            ->get();

        // 4. Biological Catch Telemetry Logs
        $telemetryLogs = DB::table('catches')
            ->where('user_id', $user->id)
            ->select([
                'id',
                'species',
                'weight',
                'location',
                'wind_speed',
                'temperature',
                'weather_condition',
                'logged_at',
                'created_at',
            ])
            ->orderByDesc('logged_at')
            ->limit(10)
            ->get();

        $myListings = Listing::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Dashboard', [
            'role' => 'fisherman',
            'stats' => [
                'withdrawableBalance' => (float) $user->wallet_balance,
                'lifetimeEarnings'    => $lifetimeNetEarnings,
                'escrowInTransit'     => $escrowInTransit,
                'loggedBiomass'       => $loggedBiomass,
                'totalBatches'        => $totalBatches,
                'withdrawable_balance' => (float) $user->wallet_balance,
                'lifetime_net_earnings' => $lifetimeNetEarnings,
                'escrow_in_transit'   => $escrowInTransit,
                'logged_biomass'      => $loggedBiomass,
            ],
            'activeAuctions'    => $activeAuctions,
            'consignmentLedger' => $consignmentLedger,
            'consignmentOrders' => $consignmentLedger,
            'consignmentSales'  => $consignmentLedger,
            'telemetryLogs'     => $telemetryLogs,
            'catchLogs'         => $telemetryLogs,
            'myListings'        => $myListings,
        ]);
    }

    /**
     * Aggregate telemetry metrics and dispatch logs for Courier role.
     */
    private function renderRiderDashboard(User $user): Response
    {
        $completedRunsCount = DB::table('orders_logistics')
            ->where('rider_id', $user->id)
            ->where('status', 'completed')
            ->count();

        $availableJobsCount = DB::table('orders_logistics')
            ->whereNull('rider_id')
            ->where('status', 'pending_dispatch')
            ->where('logistics_type', 'request_rider')
            ->count();

        $activeRunsCount = DB::table('orders_logistics')
            ->where('rider_id', $user->id)
            ->whereIn('status', ['en_route', 'delivered'])
            ->count();

        $recentLogs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->where('orders_logistics.rider_id', $user->id)
            ->select([
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.delivery_fee',
                'orders_logistics.status',
                'orders_logistics.updated_at',
            ])
            ->orderByDesc('orders_logistics.updated_at')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'role' => 'rider',
            'stats' => [
                'completedRuns'   => $completedRunsCount,
                'availableJobs'   => $availableJobsCount,
                'activeRuns'      => $activeRunsCount,
                'walletBalance'   => (float) $user->wallet_balance,
            ],
            'dispatchLogs' => $recentLogs,
        ]);
    }

    /**
     * Aggregate bidding watchlist and active purchases for Buyer role.
     */
    private function renderBuyerDashboard(User $user): Response
    {
        $bids = DB::table('bids')
            ->join('listings', 'bids.listing_id', '=', 'listings.id')
            ->where('bids.buyer_id', $user->id)
            ->select([
                'listings.id as listing_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'listings.current_bid',
                'listings.status as listing_status',
                DB::raw('MAX(bids.amount) as my_highest_bid'),
            ])
            ->groupBy('listings.id', 'listings.fish_name', 'listings.weight_kg', 'listings.location', 'listings.current_bid', 'listings.status')
            ->get()
            ->map(function ($item) {
                $item->bid_status = ((float) $item->my_highest_bid >= (float) $item->current_bid) ? 'WINNING' : 'OUTBID';
                return $item;
            });

        $buyerOrders = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->leftJoin('users as riders', 'orders_logistics.rider_id', '=', 'riders.id')
            ->where('orders_logistics.user_id', $user->id)
            ->select([
                'orders_logistics.id as order_id',
                'orders_logistics.id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'orders_logistics.escrow_balance',
                'orders_logistics.status',
                'orders_logistics.delivery_otp', // Buyer's delivery confirmation code
                'fishermen.name as fisherman_name',
                'riders.name as rider_name',
                'orders_logistics.created_at',
            ])
            ->orderByDesc('orders_logistics.created_at')
            ->get();

        return Inertia::render('Dashboard', [
            'role' => 'buyer',
            'biddingWatchlist' => $bids,
            'buyerOrders'      => $buyerOrders,
            'myOrders'         => $buyerOrders,
        ]);
    }

    /**
     * Aggregate administrative metrics for BFAR Supervision.
     */
    private function renderAdminDashboard(User $user): Response
    {
        return Inertia::render('Dashboard', [
            'role' => 'admin',
            'stats' => [
                'totalUsers'     => User::count(),
                'activeListings' => Listing::where('status', 'active')->count(),
                'totalBiomass'   => (float) DB::table('catches')->sum('weight'),
                'totalOrders'    => DB::table('orders_logistics')->count(),
            ],
        ]);
    }
}