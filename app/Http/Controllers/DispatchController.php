<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class DispatchController extends Controller
{
    /**
     * Render the dispatch board listing all open jobs.
     */
    public function index(): Response
    {
        $openJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->select(
                'orders_logistics.order_id',
                'orders_logistics.status',
                'orders_logistics.final_price',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location'
            )
            ->where('orders_logistics.status', 'pending_dispatch')
            ->whereNull('orders_logistics.rider_id')
            ->get();

        return Inertia::render('Dispatch', [
            'openJobs' => $openJobs
        ]);
    }

    /**
     * Route handler allowing a registered Rider to claim an open shipment delivery.
     */
    public function claim(Request $request, int $orderId): RedirectResponse
    {
        // Guard checking: ensure user is a courier
        if (Auth::user()->role !== 'rider') {
            return redirect()->back()->withErrors(['error' => 'Unauthorized action. Only verified couriers can claim jobs.']);
        }

        $affected = DB::table('orders_logistics')
            ->where('order_id', $orderId)
            ->where('status', 'pending_dispatch')
            ->whereNull('rider_id')
            ->update([
                'rider_id' => Auth::id(),
                'status' => 'en_route',
                'updated_at' => now(),
            ]);

        if (!$affected) {
            return redirect()->back()->withErrors(['error' => 'Job already taken or unavailable.']);
        }

        return redirect()->back()->with('success', 'Job claimed successfully! Proceed to Galas Port for pickup.');
    }

    /**
     * Mark the delivery as completed and execute the Escrow payout.
     */
    public function completeDelivery(Request $request, int $listingId): RedirectResponse
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

            // Update the orders_logistics table via DB Facade using the order_id layout mapping keys
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