<?php // File: isdalog/app/Http/Controllers/PublicMarketController.php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicMarketController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'port' => ['nullable', 'string', 'max:255'], 'page' => ['nullable', 'integer', 'min:1', 'max:100000']]);
        $term = trim($filters['q'] ?? '');
        $port = $filters['port'] ?? '';
        // This allow-list is deliberately independent of the authenticated marketplace payload.
        $query = Listing::openForTrading()->where('weight_kg', '>', 0)->where('current_bid', '>=', 0)
            ->select('id', 'fish_name', 'weight_kg', 'current_bid', 'location', 'ends_at');
        if ($term !== '') {
            \App\Services\MarketVocabulary::searchSpecies($query, $term);
        }
        if ($port !== '') {
            \App\Services\MarketVocabulary::filterPort($query, $port);
        }
        $page = $query->orderByDesc('id')->paginate(9)->withQueryString();
        $base = $request->routeIs('market.preview') ? 'market.preview' : 'home';
        if ($page->currentPage() > $page->lastPage()) {
            return redirect()->route($base, [...$request->query(), 'page' => $page->lastPage()]);
        }
        $page->through(fn ($listing) => ['id' => $listing->id, 'fish_name' => $listing->fish_name, 'weight_kg' => $listing->weight_kg, 'batch_price' => $listing->current_bid, 'unit_price' => round((float) $listing->current_bid / (float) $listing->weight_kg, 2), 'location' => $listing->location, 'ends_at' => $listing->ends_at?->toISOString()]);

        return Inertia::render('Public/Home', ['listings' => $page, 'filters' => ['q' => $term, 'port' => $port],
            'ports' => Listing::openForTrading()->where('weight_kg', '>', 0)->where('current_bid', '>=', 0)->whereNotNull('location')->where('location', '!=', '')->distinct()->orderBy('location')->pluck('location'),
            'marketOnly' => $base === 'market.preview', 'baseRoute' => $base, 'asOf' => now()->toISOString()]);
    }
}
