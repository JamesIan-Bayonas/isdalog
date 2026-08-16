<?php

namespace App\Http\Controllers;

use App\Events\CatchBidUpdated;
use App\Models\Listing;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    /**
     * Store a newly submitted bid on a live listing with concurrency lock protection.
     */
    public function store(Request $request, Listing $listing): RedirectResponse
    {
        $validated = $request->validate([
            'bid_amount' => ['required', 'numeric', 'min:1', 'max:10000000'],
        ]);

        $bidAmount = (float) $validated['bid_amount'];

        try {
            /** @var Listing $updatedListing */
            $updatedListing = DB::transaction(function () use ($listing, $bidAmount) {
                /** @var Listing|null $lockedListing */
                $lockedListing = Listing::where('id', $listing->id)->lockForUpdate()->first();

                if (! $lockedListing || $lockedListing->status !== 'active') {
                    throw new \RuntimeException('This auction is no longer active and cannot accept new bids.');
                }

                if ($bidAmount <= (float) $lockedListing->current_bid) {
                    throw new \RuntimeException(
                        'A concurrent bid of ₱' . number_format($lockedListing->current_bid, 2) . ' was placed just prior. Submit a higher amount.'
                    );
                }

                $lockedListing->update([
                    'current_bid' => $bidAmount,
                ]);

                $lockedListing->bids()->create([
                    'buyer_id' => Auth::id(),
                    'amount' => $bidAmount,
                ]);

                return $lockedListing;
            });

            // Broadcast real-time update across all WebSocket clients
            event(new CatchBidUpdated($updatedListing));

            return redirect()->back()->with(
                'success',
                'Bid of ₱' . number_format($bidAmount, 2) . ' placed successfully!'
            );
        } catch (\RuntimeException $e) {
            return redirect()->back()->withErrors([
                'bid_amount' => $e->getMessage(),
            ]);
        }
    }
}