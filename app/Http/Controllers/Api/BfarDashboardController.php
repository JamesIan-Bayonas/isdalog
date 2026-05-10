<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BfarDashboardController extends Controller
{
    public function getAnalytics(Request $request)
    {
        // 1. Set the Timeframe (Current Month)
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();

        // 2. Metric: Total Volume (KG) of Sold Fish this month
        $totalVolume = DB::table('listings')
            ->where('status', 'sold')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('weight_kg');

        // 3. Metric: Total Market Value (PHP) 
        // This calculates the total economic movement in the port
        $marketValue = DB::table('listings')
            ->where('status', 'sold')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('current_bid');

        // 4. Metric: Species Distribution (Top 5 Caught Fish)
        // Grouping by fish_name to see the most abundant catches
        $speciesDistribution = DB::table('listings')
            ->select('fish_name', DB::raw('SUM(weight_kg) as total_weight'))
            ->where('status', 'sold')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->groupBy('fish_name')
            ->orderByDesc('total_weight')
            ->limit(5)
            ->get();

        // 5. Metric: Compliance Alerts
        // For the capstone, we simulate or query rejected catches due to species restrictions
        $restrictedAlertsCount = DB::table('catches') // Or 'listings' depending on where your AI logs failures
            ->where('status', 'rejected_restricted')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        // Return a clean JSON response for React
        return response()->json([
            'success' => true,
            'timeframe' => Carbon::now()->format('F Y'),
            'metrics' => [
                'total_volume_kg' => round($totalVolume, 2),
                'total_market_value' => round($marketValue, 2),
                'restricted_alerts' => $restrictedAlertsCount,
                'active_ports' => 1, // Currently Galas Port
            ],
            'species_distribution' => $speciesDistribution
        ]);
    }
}