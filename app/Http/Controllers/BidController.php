<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Events\CatchBidUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BidController extends Controller
{
    public function store(Request $request, Listing $listing)
    {
        // 1. Security Check: Ensure the new bid is actually higher than the current one
        $request->validate([
            'bid_amount' => 'required|numeric|gt:' . $listing->current_bid,
        ]);

        // 2. Update the main Listing's current price
        $listing->update([
            'current_bid' => $request->bid_amount
        ]);

        // 3. Log it in the Bids ledger table (requires a bids() relationship in Listing.php)
        $listing->bids()->create([
            'user_id' => Auth::id(),
            'amount' => $request->bid_amount,
        ]);

        // 4. SHOUT IT TO THE WORLD! (Triggers Reverb WebSockets instantly)
        CatchBidUpdated::dispatch($listing->id, $request->bid_amount);

        // Tell the bidder's screen that their bid was accepted
        return redirect()->back()->with('success', 'Bid placed successfully!');
    }
}