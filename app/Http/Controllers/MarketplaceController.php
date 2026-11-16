<?php // File: isdalog/app/Http/Controllers/MarketplaceController.php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MarketplaceController extends Controller
{
    /**
     * Display the synchronized marketplace trading floor.
     */
    public function index(\Illuminate\Http\Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $filters = \App\Services\MarketplaceFilters::validate($request);
        $query = Listing::openForTrading()->where('weight_kg', '>', 0);
        if ($filters['q'] !== '') {
            \App\Services\MarketVocabulary::searchSpecies($query, $filters['q']);
        }
        if (! empty($filters['port'])) {
            \App\Services\MarketVocabulary::filterPort($query, $filters['port']);
        }
        $unitExpression = '(current_bid * 1.0 / weight_kg)';
        foreach (['min' => '>=', 'max' => '<='] as $bound => $operator) {
            if (isset($filters[$bound.'_price'])) {
                $query->whereRaw($unitExpression.' '.$operator.' CAST(? AS DECIMAL(20,4))', [$filters[$bound.'_price']]);
            }
            if (isset($filters[$bound.'_weight'])) {
                $query->where('weight_kg', $operator, $filters[$bound.'_weight']);
            }
        }
        match ($filters['sort']) {
            'price_asc' => $query->orderByRaw($unitExpression.' ASC'),
            'price_desc' => $query->orderByRaw($unitExpression.' DESC'),
            'weight_asc' => $query->orderBy('weight_kg'),
            'closing' => $query->orderByRaw('CASE WHEN ends_at IS NULL THEN 1 ELSE 0 END')->orderBy('ends_at'),
            default => $query->orderByDesc('created_at'),
        };
        $page = $query->orderByDesc('id')->paginate(12)->withQueryString();
        if ($page->currentPage() > $page->lastPage()) {
            return redirect()->route('marketplace.index', [...$request->query(), 'page' => $page->lastPage()]);
        }
        $benchmarks = \App\Services\MarketBenchmarks::forListings($page->getCollection());
        $favoriteIds = DB::table('favorite_listings')->where('user_id', $request->user()->id)
            ->whereIn('listing_id', $page->getCollection()->modelKeys())->pluck('listing_id')->flip();
        $listings = $page->getCollection()->map(function ($listing) use ($benchmarks, $favoriteIds) {
            $listing->is_favorite = $favoriteIds->has($listing->id);
            $listing->unit_price = round((float) $listing->current_bid / (float) $listing->weight_kg, 2);
            $listing->benchmark = $benchmarks[$listing->id];

            return $listing;
        });
        $ports = Listing::openForTrading()->select('location')->distinct()->orderBy('location')->pluck('location');
        if (! empty($filters['port']) && ! $ports->contains($filters['port'])) {
            $ports->push($filters['port']);
        }

        // 3. Fetch active logistics orders for the Receiving Bay tracking map (with OTP credentials)
        $activeOrders = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->select(
                'orders_logistics.id as order_id',
                'orders_logistics.id',
                'orders_logistics.rider_id',
                'orders_logistics.delivery_fee',
                'orders_logistics.status',
                DB::raw("CASE WHEN orders_logistics.logistics_type = 'request_rider' AND orders_logistics.status IN ('pending_dispatch', 'en_route') THEN orders_logistics.delivery_otp ELSE NULL END as delivery_otp"),
                'orders_logistics.logistics_type',
                'orders_logistics.escrow_balance',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price'
            )
            ->where('orders_logistics.user_id', Auth::id())
            ->whereIn('orders_logistics.status', ['pending_dispatch', 'en_route', 'delivered'])
            ->get();

        // 4. Return variables completely synchronized with the React parameter signatures
        return Inertia::render('Marketplace', [
            'activeListings' => $listings,
            'filters' => collect($filters)->except('page')->all(), 'ports' => $ports,
            'pagination' => ['total' => $page->total(), 'from' => $page->firstItem(), 'to' => $page->lastItem(),
                'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
                'prev_url' => $page->previousPageUrl(), 'next_url' => $page->nextPageUrl()],
            'serverNow' => now()->toISOString(),
            'activeOrders' => $activeOrders,
            'trends' => [],
        ]);
    }
}
