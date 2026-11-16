<?php // File: isdalog/app/Http/Controllers/CatchDetailController.php

namespace App\Http\Controllers;

use App\Models\Listing;
use Inertia\Inertia;

class CatchDetailController extends Controller
{
    public function show(\Illuminate\Http\Request $request, Listing $listing)
    {
        $catch = $listing->catch_id ? \App\Models\FishCatch::whereKey($listing->catch_id)->where('user_id', $listing->user_id)->first() : null;

        return Inertia::render('Catches/Show', ['trace' => \App\Services\OrderTrace::forListing($listing, $request->user()), 'benchmark' => \App\Services\MarketBenchmarks::forListings([$listing])[$listing->id], 'isFavorite' => \Illuminate\Support\Facades\DB::table('favorite_listings')->where('user_id', $request->user()->id)->where('listing_id', $listing->id)->exists(),
            'listing' => [
            'id' => $listing->id, 'fish_name' => $listing->fish_name, 'image_url' => $listing->image_url,
            'weight_kg' => $listing->weight_kg, 'current_bid' => $listing->current_bid, 'location' => $listing->location,
            'ends_at' => $listing->ends_at?->toISOString(), 'available' => $listing->isOpenForTrading() && ! $listing->orders()->exists(),
            'seller' => $listing->user?->name ?? 'Seller unavailable',
        ], 'provenance' => $catch ? ['record_id' => $catch->id, 'species' => $catch->species, 'weight' => $catch->weight,
            'location' => $catch->location, 'logged_at' => $catch->logged_at?->toISOString()] : null]);
    }
}
