<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function confirm(Request $request, $orderId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
        ]);

        DB::beginTransaction();

        try {
            // 1. Find the logistics order and the associated listing
            $order = DB::table('orders_logistics')->where('id', $orderId)->first();
            $listing = DB::table('listings')->where('id', $order->listing_id)->first();

            // 2. The Financial Math
            $totalTransactionValue = $listing->current_bid;
            
            // Calculate the 3% IsdaLog Platform Fee
            $platformFee = $totalTransactionValue * 0.03; 
            
            // Calculate the Fisherman's Final Earnings
            $fishermanEarnings = $totalTransactionValue - $platformFee;

            // 3. Release Funds to the Fisherman's Wallet
            $fisherman = User::find($listing->user_id);
            $fisherman->wallet_balance += $fishermanEarnings;
            $fisherman->save();

            // 4. Update the Order Status to reflect the completed financial handshake
            DB::table('orders_logistics')->where('id', $orderId)->update([
                'status' => 'completed',
                'escrow_status' => 'released',
                'platform_fee' => $platformFee,
                'seller_earnings' => $fishermanEarnings,
                'rating' => $request->rating,
                'updated_at' => now(),
            ]);

            DB::commit();

            // Log the revenue generation for your startup metrics!
            Log::info("IsdaLog Revenue Generated: ₱{$platformFee} from Order ID: {$orderId}");

            return redirect()->back()->with('success', 'Order confirmed and funds released to the fisherman!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Escrow Release Failed: " . $e->getMessage());
            return redirect()->back()->withErrors('An error occurred while releasing the funds.');
        }
    }
}