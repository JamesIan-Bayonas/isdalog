<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DispatchController extends Controller
{
    // 1. Show the Live Jobs Board
    public function index()
    {
        // We join the logistics table with the listings table to get the fish details
        $jobs = DB::table('orders_logistics')
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

        return Inertia::render('Dispatch', [
            'availableJobs' => $jobs
        ]);
    }

    // 2. The Rider Accepts the Job
    public function accept(Request $request, $orderId)
    {
        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'en_route',
                'updated_at' => now(),
                // In a real app, you would attach the logged-in rider's ID here:
                // 'rider_id' => auth()->id() 
            ]);

        return redirect()->back()->with('success', 'Job Accepted! Head to the pickup location.');
    }
}