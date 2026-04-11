<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Inertia\Inertia;

class MarketplaceController extends Controller
{
    public function index()
    {
        // Fetch all active listings, newest first
        $listings = Listing::where('status', 'active')->latest()->get();

        return Inertia::render('Marketplace', [
            'initialListings' => $listings
        ]);
    }
}