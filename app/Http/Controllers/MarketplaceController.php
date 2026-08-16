<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    /**
     * Display the synchronized marketplace trading floor.
     */
    public function index(): Response
    {
        // 1. Fetch active fish listings
        $listings = Listing::where('status', 'active')->latest()->get();

        // 2. The Analytics Engine: Calculate the 30-day average for trends
        $listings->transform(function ($listing) {
            $averagePrice = DB::table('listings')
                ->where('fish_name', $listing->fish_name)
                ->where('status', 'sold')
                ->where('created_at', '>=', now()->subDays(30))
                ->avg('current_bid');

            // Attach the calculated average to the object
            $listing->market_average = $averagePrice ? round($averagePrice, 2) : $listing->current_bid;
            
            // Calculate the percentage difference
            if ($listing->market_average > 0) {
                $listing->trend_percentage = round((($listing->current_bid - $listing->market_average) / $listing->market_average) * 100, 1);
            } else {
                $listing->trend_percentage = 0;
            }

            return $listing;
        });

        // 3. Fetch active logistics orders for the Receiving Bay tracking map (with OTP credentials)
        $activeOrders = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->select(
                'orders_logistics.id as order_id', 
                'orders_logistics.status',
                'orders_logistics.delivery_otp',
                'orders_logistics.logistics_type',
                'orders_logistics.escrow_balance',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'listings.current_bid as final_price'
            )
            ->where('orders_logistics.user_id', Auth::id())
            ->whereIn('orders_logistics.status', ['pending_dispatch', 'en_route', 'delivered'])
            ->get();

        // 4. Return variables completely synchronized with the React parameter signatures
        return Inertia::render('Marketplace', [
            'activeListings' => $listings,
            'activeOrders'   => $activeOrders,
            'trends'         => []
        ]);
    }
}