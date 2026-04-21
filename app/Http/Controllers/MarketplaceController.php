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
        // Fetch all active listings, newest first
        $listings = Listing::where('status', 'active')->latest()->get();

        // Fetch orders belonging to the logged-in merchant that are currently in transit or waiting for receipt
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