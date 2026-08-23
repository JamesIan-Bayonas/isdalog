<?php

namespace App\Http\Controllers;

use App\Events\CatchBidUpdated;
use App\Models\Bid;
use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    public function store(Request $request, Listing $listing): RedirectResponse
    {
        // 1. RBAC Guardrail: Only verified buyer accounts may participate in bidding
        if ($request->user()->role !== 'buyer') {
            abort(403, 'Unauthorized. Only verified buyers are permitted to place auction bids.');
        }

        // 2. Self-Bidding Prevention Guardrail
        if ((int) $request->user()->id === (int) $listing->user_id) {
            abort(403, 'Harvesters cannot place bids on their own catch listings.');
        }

        $validated = $request->validate([
            'bid_amount' => ['required', 'numeric', 'gt:' . $listing->current_bid],
        ]);

        DB::transaction(function () use ($listing, $validated) {
            // Lock listing row to prevent race conditions
            /** @var Listing $lockedListing */
            $lockedListing = Listing::where('id', $listing->id)->lockForUpdate()->first();

            if ($lockedListing->status !== 'active') {
                abort(422, 'Listing is no longer accepting bids.');
            }

            if ((float) $validated['bid_amount'] <= (float) $lockedListing->current_bid) {
                abort(422, 'Bid must be strictly higher than the current highest bid.');
            }

            // 1. Create the persistent bid record for the authenticated buyer
            Bid::create([
                'listing_id' => $lockedListing->id,
                'buyer_id' => Auth::id(),
                'amount' => $validated['bid_amount'],
            ]);

            // 2. Update the listing's current price floor
            $lockedListing->update([
                'current_bid' => $validated['bid_amount'],
            ]);

            // 3. Broadcast real-time Reverb WebSocket event
            event(new CatchBidUpdated($lockedListing));
        });

        return redirect()->back()->with('success', 'Bid placed successfully!');
    }
}