<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Support\Facades\Auth; // Make sure this is at the top!
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function store(Request $request, Listing $listing)
    {
        // 1. Validate the logistics choice
        // dd($listing); // Let's simplify and inspect the $listing variable

        $request->validate([
            'logistics_type' => 'required|in:self_pickup,request_rider',
        ]);

        // We use a Database Transaction to ensure either EVERYTHING saves, or NOTHING saves
        DB::beginTransaction();

        try {
            // 2. Update the Listing Status so it drops off the active market
            $listing->update([
                'status' => 'pending_logistics'
            ]);

            // 3. Create the Logistics Record (Matches your orders_logistics_table migration)
            DB::table('orders_logistics')->insert([
                'listing_id' => $listing->id,
                'buyer_id' => Auth::id(),
                'delivery_type' => $request->logistics_type,
                'status' => 'finding_rider', // Initial state
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. THE REVERSE HANDSHAKE (Ping the Node.js Telegram Bot!)
            // We send the good news back to the bot so the fisherman gets a message
            try {
                Http::timeout(5)->post('http://localhost:3000/api/notify-fisherman', [
                    'listing_id' => $listing->id,
                    'fish_name' => $listing->fish_name,
                    'final_price' => $listing->current_bid,
                    'logistics_type' => $request->logistics_type,
                ]);
            } catch (\Exception $e) {
                // If the bot is offline, we log the error but don't crash the user's checkout
                Log::error('Failed to ping Node.js Bot: ' . $e->getMessage());
            }

            DB::commit();

            return redirect()->back()->with('success', 'Order confirmed! Logistics have been arranged.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Something went wrong processing your order.']);
        }
    }
}