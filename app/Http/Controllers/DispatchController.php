<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DispatchController extends Controller
{
    /**
     * Mark the delivery as completed and execute the Escrow payout.
     */
    public function completeDelivery(Request $request, $listingId)
    {
        try {
            DB::beginTransaction();

            // 1. Lock the listing row for update to prevent race conditions during the transaction
            $listing = Listing::where('id', $listingId)->lockForUpdate()->firstOrFail();

            // 2. Strict State Verification (Guardrail)
            if ($listing->status !== 'pending_logistics') {
                throw new \Exception("Integrity Violation: Listing is not in transit.");
            }

            // 3. The 3% Business Model Calculation
            $finalBid = $listing->current_bid;
            $platformFee = $finalBid * 0.03;
            $fishermanPayout = $finalBid - $platformFee;

            // 4. Update the Fisherman's Wallet
            $fisherman = User::findOrFail($listing->user_id); 
            $fisherman->wallet_balance += $fishermanPayout;
            $fisherman->save();

            // 5. Update logistics and listing state to 'completed' (Strict Enum Adherence)
            $listing->status = 'completed';
            $listing->save();

            // Assuming you update the orders_logistics table via DB Facade or Eloquent Model
            DB::table('orders_logistics')
                ->where('listing_id', $listingId)
                ->update(['status' => 'completed', 'escrow_released_at' => now()]);

            DB::commit();

            // Return success payload for Inertia
            return redirect()->back()->with([
                'success' => 'Delivery completed successfully.',
                'payout' => $fishermanPayout
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Escrow Release Failed: ' . $e->getMessage());
            
            return redirect()->back()->withErrors([
                'error' => 'Transaction failed. Funds secured in escrow.'
            ]);
        }
    }
}