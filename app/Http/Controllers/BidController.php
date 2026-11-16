<?php // File: isdalog/app/Http/Controllers/BidController.php

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
            'bid_amount' => ['required', 'numeric', 'min:0.01', 'max:99999999.99', 'decimal:0,2'],
        ]);

        DB::transaction(function () use ($request, $listing, $validated) {
            // Lock listing row to prevent race conditions
            /** @var Listing $lockedListing */
            $lockedListing = Listing::where('id', $listing->id)->lockForUpdate()->firstOrFail();

            if (! $lockedListing->isOpenForTrading() || $lockedListing->orders()->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages(['bid_amount' => 'Listing is no longer accepting bids.']);
            }

            abort_unless($request->user()->role === 'buyer' && (int) $request->user()->id !== (int) $lockedListing->user_id, 403);
            if (\App\Services\AccountLedger::cents($validated['bid_amount']) <= \App\Services\AccountLedger::cents($lockedListing->current_bid)) {
                throw \Illuminate\Validation\ValidationException::withMessages(['bid_amount' => 'Bid must be strictly higher than the current highest bid.']);
            }

            $previous = $lockedListing->bids()->orderByDesc('amount')->orderBy('id')->first();
            // 1. Create the persistent bid record for the authenticated buyer
            $bid = Bid::create([
                'listing_id' => $lockedListing->id,
                'buyer_id' => Auth::id(),
                'amount' => $validated['bid_amount'],
            ]);

            \App\Services\TransactionNotifications::record([$lockedListing->user_id], 'bid:'.$bid->id.':offer', 'New offer received', 'A buyer made a new offer on listing #'.$lockedListing->id.'. Review the current offer before accepting.', 'listing', $lockedListing->id);
            if ($previous && (int) $previous->buyer_id !== (int) Auth::id()) \App\Services\TransactionNotifications::record([$previous->buyer_id], 'bid:'.$bid->id.':outbid', 'Your offer was outbid', 'A higher offer was recorded on listing #'.$lockedListing->id.'. No funds were reserved for your offer.', 'listing', $lockedListing->id);
            // 2. Update the listing's current price floor
            $lockedListing->update([
                'current_bid' => $validated['bid_amount'],
            ]);

            // 3. Broadcast real-time Reverb WebSocket event
            DB::afterCommit(fn () => event(new CatchBidUpdated($lockedListing)));
        });

        return redirect()->back()->with('success', 'Bid placed successfully!');
    }
}
