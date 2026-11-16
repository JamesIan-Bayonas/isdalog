<?php // File: isdalog/app/Http/Controllers/ListingController.php

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
        abort_unless($request->user()->role === 'fisherman', 403);
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
            'ends_at' => now()->addDays(2),
        ]);

        return Redirect::route('dashboard')->with('success', 'Listing created successfully!');
    }

    /**
     * Harvester officially accepts the highest bid, locking escrow and dispatching courier handshake OTPs.
     */
    public function acceptBid(Request $request, Listing $listing): RedirectResponse
    {
        return DB::transaction(function () use ($request, $listing) {
            // Same lock order as direct purchase: listing, then buyer account.
            $lockedListing = Listing::whereKey($listing->id)->lockForUpdate()->firstOrFail();
            abort_unless($request->user()->role === 'fisherman' && (int) $lockedListing->user_id === (int) $request->user()->id, 403);
            if (! $lockedListing->isOpenForTrading()
                || $lockedListing->orders()->exists()) {
                return back()->withErrors(['error' => 'This harvest auction is already closed or completed.']);
            }
            // Bidding locks this same listing, so the winning offer stays stable until commit.
            $topBid = $lockedListing->bids()->orderByDesc('amount')->orderBy('id')->first();
            if (! $topBid) {
                return back()->withErrors(['error' => 'Cannot award auction: No bids have been placed on this catch yet.']);
            }
            $buyer = User::whereKey($topBid->buyer_id)->lockForUpdate()->first();
            if (! $buyer || $buyer->role !== 'buyer' || (int) $buyer->id === (int) $lockedListing->user_id
                || \App\Services\AccountLedger::cents($topBid->amount) <= 0 || \App\Services\AccountLedger::cents($buyer->wallet_balance) < \App\Services\AccountLedger::cents($topBid->amount)) {
                return back()->withErrors(['error' => 'Leading bidder is ineligible or has insufficient wallet funds to lock escrow.']);
            }
            $lockedListing->update(['status' => 'completed']);
            $orderId = DB::table('orders_logistics')->insertGetId([
                ...\App\Services\SaleFacts::capture($lockedListing),
                'listing_id' => $lockedListing->id, 'user_id' => $buyer->id,
                'fisherman_id' => $lockedListing->user_id, 'rider_id' => null,
                'final_price' => $topBid->amount, 'escrow_balance' => $topBid->amount,
                'pickup_otp' => (string) random_int(100000, 999999),
                'delivery_otp' => (string) random_int(100000, 999999),
                'delivery_details_required' => true,
                'logistics_type' => 'request_rider', 'status' => 'pending_dispatch',
                'created_at' => now(), 'updated_at' => now(),
            ]);
            \App\Services\AccountLedger::move($buyer->id, -\App\Services\AccountLedger::cents($topBid->amount), 'escrow_reservation', $orderId);
            \App\Services\TransactionNotifications::order($orderId, 'created', 'Catch sale recorded', 'Order #'.$orderId.' is awaiting handover. Funds are held in the internal escrow record.');

            return back()->with('success', 'Winning bid of ₱'.number_format($topBid->amount, 2).' accepted from '.$buyer->name.'! Escrow secured and courier pickup code generated.');
        }, 3);
    }
}
