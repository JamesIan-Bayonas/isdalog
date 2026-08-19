<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;

class ListingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fish_name' => 'required|string|max:255',
            'weight_kg' => 'required|numeric|min:0.1',
            'starting_price' => 'required|numeric|min:1',
            'location' => 'required|string|max:255',
        ]);

        Listing::create([
            'user_id' => Auth::id(), 
            'fish_name' => $validated['fish_name'],
            'weight_kg' => $validated['weight_kg'],
            'starting_price' => $validated['starting_price'],
            'current_bid' => $validated['starting_price'],
            'location' => $validated['location'],
            'status' => 'active',
        ]);

        return Redirect::route('dashboard')->with('success', 'Listing created successfully!');
    }

    /**
     * Harvester officially accepts the highest bid, locking escrow and dispatching courier handshake OTPs.
     */
    public function acceptBid(Request $request, Listing $listing): RedirectResponse
    {
        $user = $request->user();

        // 1. Authorization Guardrail: Only the listing creator can award the auction
        if ((int) $listing->user_id !== (int) $user->id) {
            abort(403, 'Unauthorized action. You do not own this harvest listing.');
        }

        if ($listing->status !== 'active') {
            return redirect()->back()->withErrors([
                'error' => 'This harvest auction is already closed or completed.',
            ]);
        }

        // 2. Fetch the highest submitted bid
        $topBid = $listing->bids()->orderByDesc('amount')->first();

        if (! $topBid) {
            return redirect()->back()->withErrors([
                'error' => 'Cannot award auction: No bids have been placed on this catch yet.',
            ]);
        }

        // 3. Verify the winning buyer has sufficient funds in virtual wallet
        /** @var User|null $buyer */
        $buyer = User::find($topBid->buyer_id);
        if (! $buyer || (float) $buyer->wallet_balance < (float) $topBid->amount) {
            return redirect()->back()->withErrors([
                'error' => "Leading bidder ({$buyer->name}) has insufficient wallet funds to lock escrow.",
            ]);
        }

        // 4. Atomic Escrow Transaction & Handshake Generation
        DB::transaction(function () use ($listing, $topBid, $buyer, $user) {
            // Deduct funds from buyer's liquid balance
            $buyer->decrement('wallet_balance', $topBid->amount);

            // Mark auction as completed
            $listing->update([
                'status' => 'completed',
            ]);

            // Cryptographic Handshake 6-digit OTPs
            $pickupOtp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            $deliveryOtp = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

            // Create Escrow Logistics Entry
            DB::table('orders_logistics')->insert([
                'listing_id' => $listing->id,
                'user_id' => $buyer->id,
                'fisherman_id' => $user->id,
                'rider_id' => null,
                'final_price' => $topBid->amount,
                'escrow_balance' => $topBid->amount,
                'pickup_otp' => $pickupOtp,
                'delivery_otp' => $deliveryOtp,
                'logistics_type' => 'request_rider',
                'status' => 'pending_dispatch',
            'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return redirect()->back()->with(
            'success',
            "Winning bid of ₱" . number_format($topBid->amount, 2) . " accepted from {$buyer->name}! Escrow secured and courier pickup code generated."
        );
    }
}