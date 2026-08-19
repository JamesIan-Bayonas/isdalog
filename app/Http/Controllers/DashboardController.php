<?php

namespace App\Http\Controllers;

use App\Models\FishCatch;
use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. FISHERMAN LEDGER QUERY WITH PICKUP OTP
        $fishermanLedger = [];
        if ($user->role === 'fisherman') {
            $fishermanLedger = DB::table('orders_logistics')
                ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
                ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
                ->where('orders_logistics.fisherman_id', $user->id)
                ->select(
                    'orders_logistics.id as order_id',
                    'listings.fish_name as species',
                    'listings.weight_kg as weight',
                    'orders_logistics.final_price as gross_sale',
                    'orders_logistics.platform_fee',
                    'orders_logistics.seller_earnings as net_payout',
                    'buyers.name as buyer_name',
                    'orders_logistics.status',
                    'orders_logistics.pickup_otp',
                    'orders_logistics.created_at'
                )
                ->orderByDesc('orders_logistics.created_at')
                ->get();
        }

        // Return Inertia View Props
        return Inertia::render('Dashboard', [
            'fishermanLedger' => $fishermanLedger,
            'auth' => [
                'user' => $user
            ]
        ]);
    }
}