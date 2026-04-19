<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DispatchController extends Controller
{
    public function index()
    {
        // 1. Fetch jobs waiting for a rider
        $availableJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->where('orders_logistics.status', 'finding_rider')
            ->select(
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location as pickup_location',
                'listings.current_bid as final_price',
                'orders_logistics.created_at'
            )
            ->orderBy('orders_logistics.created_at', 'desc')
            ->get();

        // 2. Fetch jobs the rider is currently delivering
        $activeJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->where('orders_logistics.status', 'en_route')
            ->select(
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location as pickup_location',
                'listings.current_bid as final_price',
                'orders_logistics.updated_at'
            )
            ->orderBy('orders_logistics.updated_at', 'desc')
            ->get();

        return Inertia::render('Dispatch', [
            'availableJobs' => $availableJobs,
            'activeJobs' => $activeJobs
        ]);
    }

    public function accept(Request $request, $orderId)
    {
        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'en_route',
                'updated_at' => now(),
            ]);

        return redirect()->back()->with('success', 'Job Accepted! Head to the pickup location.');
    }

    public function markDelivered($orderId)
    {
        \Illuminate\Support\Facades\DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'delivered',
                'updated_at' => now()
            ]);

        return redirect()->back()->with('success', 'Handover complete! Waiting for Merchant confirmation.');
    }   
}