<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function index()
    {
        // 1. Fetch active listings
        $listings = Listing::where('status', 'active')->latest()->get();

        // 2. The Analytics Engine: Calculate the 30-day average for each active listing
        $listings->transform(function ($listing) {
            $averagePrice = DB::table('listings')
                ->where('fish_name', $listing->fish_name)
                ->where('status', 'sold')
                ->where('created_at', '>=', now()->subDays(30))
                ->avg('current_bid');

            // Attach the calculated average to the object (or default to current bid if no history exists)
            $listing->market_average = $averagePrice ? round($averagePrice, 2) : $listing->current_bid;
            
            // Calculate the percentage difference
            if ($listing->market_average > 0) {
                $listing->trend_percentage = round((($listing->current_bid - $listing->market_average) / $listing->market_average) * 100, 1);
            } else {
                $listing->trend_percentage = 0;
            }

            return $listing;
        });

        // 3. Fetch active logistics orders for the Receiving Bay
        $activeOrders = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->where('orders_logistics.merchant_id', Auth::id())
            ->whereIn('orders_logistics.status', ['en_route', 'delivered'])
            ->select(
                'orders_logistics.id as order_id',
                'orders_logistics.status',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.current_bid as final_price'
            )
            ->get();

        return Inertia::render('Marketplace', [
            'initialListings' => $listings,
            'activeOrders' => $activeOrders
        ]);
    }
}