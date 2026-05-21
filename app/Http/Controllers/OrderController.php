<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\RedirectResponse;

class OrderController extends Controller
{
    public function store(Request $request, Listing $listing): RedirectResponse
    {
        $request->validate([
            'logistics_type' => 'required|in:self_pickup,request_rider'
        ]);

        /** @var \App\Models\User $buyer */
        $buyer = Auth::user();
        $finalPrice = (float) $listing->current_bid;

        if ($buyer->wallet_balance < $finalPrice) {
            return redirect()->back()->withErrors(['error' => 'Insufficient wallet balance to secure escrow.']);
        }

        // Variable to hold order details for broadcasting
        $broadcastOrder = null;

        DB::transaction(function () use ($listing, $buyer, $finalPrice, $request, &$broadcastOrder) {
            $buyer->decrement('wallet_balance', $finalPrice);

            // Insert into DB and grab the generated ID
            $orderId = DB::table('orders_logistics')->insertGetId([
                'listing_id' => $listing->id,
                'user_id' => $buyer->id, 
                'fisherman_id' => $listing->user_id,
                'rider_id' => null,
                'final_price' => $finalPrice,
                'escrow_balance' => $finalPrice,
                'logistics_type' => $request->logistics_type,
                'status' => $request->logistics_type === 'request_rider' ? 'pending_dispatch' : 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $listing->update(['status' => 'closed']);

            // Populate broadcast structure if a rider is requested
            if ($request->logistics_type === 'request_rider') {
                $broadcastOrder = (object) [
                    'order_id' => $orderId,
                    'fish_name' => $listing->fish_name,
                    'weight_kg' => $listing->weight_kg,
                    'final_price' => $finalPrice,
                    'location' => $listing->location,
                ];
            }
        });

        // SHOUT IT TO THE RIDERS! Trigger WebSocket broadcast instantly
        if ($broadcastOrder) {
            event(new \App\Events\OrderDispatched($broadcastOrder));
        }

        return redirect()->route('marketplace.index')->with('success', 'Funds successfully secured in Escrow!');
    }

    public function confirm(Request $request, int $orderId): RedirectResponse
    {
        $request->validate([
            'rating' => 'required|integer|between:1,5'
        ]);

        // FIXED: Using $orderId argument constraint here directly
        $order = DB::table('orders_logistics')->where('order_id', $orderId)->first();

        if (!$order || $order->escrow_balance <= 0) {
            return redirect()->back()->withErrors(['error' => 'Order invalid or escrow already released.']);
        }

        DB::transaction(function () use ($order, $request) {
            $totalEscrow = (float) $order->escrow_balance;

            // Compute platform fee architecture (3%)
            $platformFee = $totalEscrow * 0.03;
            $fishermanPayout = $totalEscrow - $platformFee;

            // Credit the Fisherman's wallet
            User::where('id', $order->fisherman_id)->increment('wallet_balance', $fishermanPayout);

            // Update row layout status details and drain escrow tracker to 0
            // FIXED: Changed from $order->id to $order->order_id to match your native migration schema
            DB::table('orders_logistics')->where('order_id', $order->order_id)->update([
                'status' => 'delivered',
                'escrow_balance' => 0, // Cleared out safely
                'rating' => $request->rating,
                'updated_at' => now()
            ]);
        });

        return redirect()->back()->with('success', 'Delivery confirmed. Payout successfully wired to Fisherman!');
    }
}