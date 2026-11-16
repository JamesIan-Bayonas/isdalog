<?php // File: isdalog/app/Http/Controllers/SavedDiscoveryController.php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Services\MarketplaceFilters;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SavedDiscoveryController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $openListings = Listing::openForTrading()->where('weight_kg', '>', 0)->select('listings.id');
        $favorites = Listing::query()->join('favorite_listings as favorites', 'favorites.listing_id', '=', 'listings.id')
            ->where('favorites.user_id', $userId)->orderByDesc('favorites.id')
            ->select('listings.id', 'listings.fish_name', 'listings.location')
            ->selectRaw('CASE WHEN listings.id IN ('.$openListings->toSql().') THEN 1 ELSE 0 END as available', $openListings->getBindings())
            ->paginate(12, pageName: 'favorites_page')->withQueryString();

        $searches = DB::table('saved_market_searches')->where('user_id', $userId)->orderByDesc('id')
            ->paginate(12, pageName: 'searches_page')->withQueryString()
            ->through(function ($search) {
                $search->filters = json_decode($search->filters, true);

                return $search;
            });

        return Inertia::render('SavedDiscovery', ['favorites' => $favorites, 'searches' => $searches]);
    }

    public function favorite(Request $request, Listing $listing)
    {
        $data = $request->validate(['saved' => ['required', 'boolean']]);
        $key = ['user_id' => $request->user()->id, 'listing_id' => $listing->id];
        if ($data['saved']) {
            DB::table('favorite_listings')->upsert([[...$key, 'created_at' => now(), 'updated_at' => now()]], array_keys($key), ['updated_at']);
        } else {
            DB::table('favorite_listings')->where($key)->delete();
        }

        return back();
    }

    public function saveSearch(Request $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:80']]);
        $filters = MarketplaceFilters::validate($request);
        unset($filters['page']);

        DB::table('saved_market_searches')->upsert([[
            'user_id' => $request->user()->id, 'name' => $data['name'], 'filters' => json_encode($filters, JSON_THROW_ON_ERROR),
            'created_at' => now(), 'updated_at' => now(),
        ]], ['user_id', 'name'], ['filters', 'updated_at']);

        return back()->with('success', 'Search saved.');
    }

    public function removeSearch(Request $request, int $search)
    {
        $deleted = DB::table('saved_market_searches')->where('user_id', $request->user()->id)->where('id', $search)->delete();
        abort_unless($deleted, 404);

        return back();
    }
}
