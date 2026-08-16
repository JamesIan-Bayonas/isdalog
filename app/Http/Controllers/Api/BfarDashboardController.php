<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BfarDashboardController extends Controller
{
    /**
     * Compute real-time municipal maritime catch analytics for administrative monitoring.
     */
    public function index(Request $request): Response
    {
        // 1. Guardrail: Strictly restrict telemetry access to administrative monitors
        if ($request->user() && $request->user()->role !== 'admin') {
            abort(403, 'Unauthorized action. BFAR Administrative access required.');
        }

        // 2. Aggregate Biomass Volume & Economic Turnover Metrics
        $completedListings = DB::table('listings')
            ->whereIn('status', ['closed', 'completed'])
            ->get();

        $totalBiomassKg = (float) $completedListings->sum('weight_kg');
        $totalMarketVolume = (float) DB::table('orders_logistics')->sum('final_price');
        $activeFishermenCount = DB::table('users')->where('role', 'fisherman')->count();
        $activeCouriersCount = DB::table('users')->where('role', 'rider')->count();
        $avgPricePerKg = $totalBiomassKg > 0 ? round($totalMarketVolume / $totalBiomassKg, 2) : 0.00;

        // 3. Species Biomass Distribution Matrix
        $speciesVolumeData = DB::table('listings')
            ->select(
                'fish_name',
                DB::raw('SUM(weight_kg) as total_weight'),
                DB::raw('COUNT(*) as catch_count'),
                DB::raw('AVG(current_bid) as avg_price')
            )
            ->whereIn('status', ['closed', 'completed'])
            ->groupBy('fish_name')
            ->orderBy('total_weight', 'desc')
            ->get()
            ->map(function ($row) {
                return [
                    'fish_name' => $row->fish_name,
                    'total_weight' => (float) $row->total_weight,
                    'catch_count' => (int) $row->catch_count,
                    'avg_price' => round((float) $row->avg_price, 2),
                ];
            });

        // 4. Historical Catch Volume Trends (Chronological Time-Series Aggregation)
        $trendsData = DB::table('listings')
            ->whereIn('status', ['closed', 'completed', 'active'])
            ->select('weight_kg', 'current_bid', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy(function ($item) {
                return substr((string) $item->created_at, 0, 10);
            })
            ->map(function ($dayListings, $date) {
                return [
                    'date' => $date,
                    'biomass_kg' => round((float) $dayListings->sum('weight_kg'), 2),
                    'traded_value' => round((float) $dayListings->sum('current_bid'), 2),
                    'total_catches' => $dayListings->count(),
                ];
            })
            ->values();

        // 5. Port Landing Distribution Matrix
        $portDistribution = DB::table('listings')
            ->select(
                'location',
                DB::raw('SUM(weight_kg) as total_weight'),
                DB::raw('COUNT(*) as total_landings'),
                DB::raw('SUM(current_bid) as total_value')
            )
            ->groupBy('location')
            ->orderBy('total_weight', 'desc')
            ->get()
            ->map(function ($row) {
                return [
                    'location' => $row->location ?: 'Galas Port',
                    'total_weight' => (float) $row->total_weight,
                    'total_landings' => (int) $row->total_landings,
                    'total_value' => (float) $row->total_value,
                ];
            });

        // 6. High-Risk Marine Conservation Infractions (Restricted Species Cross-Reference)
        $restrictedSpeciesList = DB::table('restricted_species')->pluck('species')->toArray();

        $sustainabilityAlerts = DB::table('listings')
            ->join('users', 'listings.user_id', '=', 'users.id')
            ->whereIn('listings.fish_name', $restrictedSpeciesList)
            ->select(
                'listings.id as listing_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'listings.created_at as captured_at',
                'users.name as fisherman_name'
            )
            ->orderBy('listings.created_at', 'desc')
            ->get();

        return Inertia::render('BfarDashboard', [
            'metrics' => [
                'total_biomass_kg' => $totalBiomassKg,
                'total_market_value' => $totalMarketVolume,
                'active_fishermen' => $activeFishermenCount,
                'active_riders' => $activeCouriersCount,
                'avg_price_per_kg' => $avgPricePerKg,
            ],
            'speciesDistribution' => $speciesVolumeData,
            'catchVolumeTrends' => $trendsData,
            'portDistribution' => $portDistribution,
            'alerts' => $sustainabilityAlerts,
        ]);
    }

    /**
     * REST API Endpoint for Edge/Microservice Analytics Ingestion.
     */
    public function getAnalytics(): JsonResponse
    {
        $totalBiomassKg = (float) DB::table('listings')
            ->whereIn('status', ['closed', 'completed'])
            ->sum('weight_kg');

        $totalMarketVolume = (float) DB::table('orders_logistics')->sum('final_price');

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_biomass_kg' => $totalBiomassKg,
                'total_market_value' => $totalMarketVolume,
                'species_distribution' => DB::table('listings')
                    ->select('fish_name', DB::raw('SUM(weight_kg) as total_weight'))
                    ->whereIn('status', ['closed', 'completed'])
                    ->groupBy('fish_name')
                    ->get(),
            ],
        ]);
    }
}