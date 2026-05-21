<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BfarDashboardController extends Controller
{
    /**
     * Compute real-time municipal maritime catch analytics for administrative monitoring.
     */
    public function index(): Response
    {
        // 1. Calculate Aggregate Biomass volume (Total kilograms harvested)
        $totalBiomassKg = (float) DB::table('listings')
            ->whereIn('status', ['closed', 'completed'])
            ->sum('weight_kg');

        // 2. Compute Total Economic Volume Locked/Traded inside the Marketplace
        $totalMarketVolume = (float) DB::table('orders_logistics')
            ->sum('final_price');

        // 3. Count Active Multi-sided Fleet Operators
        $activeFishermenCount = DB::table('users')->where('role', 'fisherman')->count();
        $activeCouriersCount = DB::table('users')->where('role', 'rider')->count();

        // 4. Species Distribution Breakdown (Biomass per Species Matrix)
        $speciesVolumeData = DB::table('listings')
            ->select('fish_name', DB::raw('SUM(weight_kg) as total_weight'), DB::raw('COUNT(*) as catch_count'))
            ->whereIn('status', ['closed', 'completed'])
            ->groupBy('fish_name')
            ->orderBy('total_weight', 'desc')
            ->get();

        // 5. Query Active High-Risk Infractions (Restricted Protected Species Flag System)
        // Cross-references your catches against the restricted species definition tables
        $sustainabilityAlerts = DB::table('listings')
            ->join('users', 'listings.user_id', '=', 'users.id')
            ->select(
                'listings.id as listing_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.created_at as captured_at',
                'users.name as fisherman_name'
            )
            // Fixed, synchronized version
            ->whereIn('listings.fish_name', function ($query) {
                $query->select('name')->from('restricted_species'); // FIXED: changed column to 'name'
            })
            ->orderBy('listings.created_at', 'desc')
            ->get();

        // 6. Pass data payload directly to the Inertia frontend compiler
        return Inertia::render('BfarDashboard', [
            'metrics' => [
                'total_biomass_kg' => $totalBiomassKg,
                'total_market_value' => $totalMarketVolume,
                'active_fishermen' => $activeFishermenCount,
                'active_riders' => $activeCouriersCount,
            ],
            'speciesDistribution' => $speciesVolumeData,
            'alerts' => $sustainabilityAlerts
        ]);
    }
}