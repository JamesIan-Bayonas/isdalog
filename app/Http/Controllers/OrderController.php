<?php // File: isdalog/app/Http/Controllers/OrderController.php

namespace App\Http\Controllers;

use App\Events\CargoStatusUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\OrderReview;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function store(Request $request, \App\Models\Listing $listing): RedirectResponse
    {
        abort_unless($request->user()->role === 'buyer', 403);
        $validated = $request->validate([
            'logistics_type' => ['required', 'in:self_pickup,request_rider'],
        ]);

        return DB::transaction(function () use ($request, $listing, $validated) {
            $lockedListing = \App\Models\Listing::whereKey($listing->id)->lockForUpdate()->firstOrFail();
            $buyer = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if ($buyer->role !== 'buyer' || ! $lockedListing->isOpenForTrading()
                || $lockedListing->orders()->exists() || (int) $lockedListing->user_id === (int) $buyer->id) {
                return back()->withErrors(['error' => 'This listing is not available for purchase.']);
            }
            // A direct purchase must not bypass a submitted auction offer.
            if ($lockedListing->bids()->exists()) {
                return back()->withErrors(['error' => 'This catch has bids. The fisherman must accept the winning offer.']);
            }
            $price = $lockedListing->current_bid ?? $lockedListing->starting_price;
            if (\App\Services\AccountLedger::cents($price) <= 0 || \App\Services\AccountLedger::cents($buyer->wallet_balance) < \App\Services\AccountLedger::cents($price)) {
                return back()->withErrors(['error' => 'Insufficient wallet funds to secure this catch.']);
            }
            $lockedListing->update(['status' => 'completed']);
            $pickupOtp = (string) random_int(100000, 999999);
            $deliveryOtp = (string) random_int(100000, 999999);
            $orderId = DB::table('orders_logistics')->insertGetId([
                ...\App\Services\SaleFacts::capture($lockedListing),
                'listing_id' => $lockedListing->id, 'user_id' => $buyer->id,
                'fisherman_id' => $lockedListing->user_id,
                'final_price' => $price, 'escrow_balance' => $price,
                'pickup_otp' => $pickupOtp, 'delivery_otp' => $deliveryOtp,
                'delivery_details_required' => $validated['logistics_type'] === 'request_rider',
                'logistics_type' => $validated['logistics_type'], 'status' => 'pending_dispatch',
                'created_at' => now(), 'updated_at' => now(),
            ]);
            \App\Services\AccountLedger::move($buyer->id, -\App\Services\AccountLedger::cents($price), 'escrow_reservation', $orderId);
            \App\Services\TransactionNotifications::order($orderId, 'created', 'Catch sale recorded', 'Order #'.$orderId.' is awaiting handover. Funds are held in the internal escrow record.');
            $fisherman = User::find($lockedListing->user_id);
            if ($fisherman?->contact_number) {
                SendSmsNotification::enqueue($fisherman->contact_number, "IsdaLog Handshake Pickup OTP: {$pickupOtp}");
            }
            if ($buyer->contact_number) {
                SendSmsNotification::enqueue($buyer->contact_number, "IsdaLog Delivery Confirmation OTP: {$deliveryOtp}");
            }

            return redirect()->route('dashboard')->with('success', 'Catch secured. Funds are held in escrow.');
        }, 3);
    }

    public function confirm(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'pickup_otp' => ['nullable', 'string', 'size:6'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'fisherman_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'fisherman_comment' => ['nullable', 'string', 'max:500'],
            'rider_rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'rider_comment' => ['nullable', 'string', 'max:500'],
        ]);

        $currentUser = $request->user();

        return DB::transaction(function () use ($validated, $id, $currentUser) {
            $order = DB::table('orders_logistics')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return redirect()->back()->withErrors(['error' => 'Order record not found.']);
            }

            if ($currentUser->role !== 'buyer' || (int) $order->user_id !== (int) $currentUser->id) {
                return redirect()->back()->withErrors(['error' => 'Unauthorized. Only the buyer who ordered this catch can release escrow.']);
            }

            if ($order->status === 'completed') {
                return redirect()->back()->withErrors(['error' => 'This order has already been finalized and settled.']);
            }

            if (DB::table('order_issues')->where('order_id', $id)->where('status', 'open')->exists()) {
                return back()->withErrors(['error' => 'Settlement is paused while this order issue is reviewed.']);
            }
            $selfPickup = $order->logistics_type === 'self_pickup';
            $pickupConfirmed = $selfPickup && $order->status === 'pending_dispatch'
                && ! empty($order->pickup_otp) && isset($validated['pickup_otp'])
                && hash_equals((string) $order->pickup_otp, $validated['pickup_otp']);
            if ($order->status !== 'delivered' && ! $pickupConfirmed) {
                return back()->withErrors(['error' => 'Confirm receipt only after delivery, or provide the fisherman pickup code for self-pickup.']);
            }
            $price = \App\Services\AccountLedger::cents($order->final_price);
            $fee = \App\Services\AccountLedger::cents($order->delivery_fee ?? 0);
            $funded = \App\Services\AccountLedger::cents($order->escrow_balance);
            if ($price <= 0 || $fee < 0 || $funded !== $price + $fee || ($selfPickup && ($fee !== 0 || $order->rider_id))
                || ($fee > 0 && ! $order->rider_id) || DB::table('order_settlements')->where('order_id', $id)->exists()) {
                return back()->withErrors(['error' => 'Escrow does not match the funded purchase and delivery charges. Contact support.']);
            }
            $ids = array_unique(array_filter([$order->fisherman_id, $order->rider_id]));
            $accounts = User::whereIn('id', $ids)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
            $fisherman = $accounts->get($order->fisherman_id);
            $rider = $order->rider_id ? $accounts->get($order->rider_id) : null;
            if (! $fisherman || $fisherman->role !== 'fisherman' || ($order->rider_id && (! $rider || $rider->role !== 'rider'))) {
                return back()->withErrors(['error' => 'A settlement recipient is missing or ineligible. Contact support.']);
            }
            // Integer-cent half-up rounding retains the existing 97% seller share.
            $sellerCents = intdiv($price * 97 + 50, 100);
            $platformCents = $price - $sellerCents;
            $fishermanShare = \App\Services\AccountLedger::decimal($sellerCents);
            \App\Services\AccountLedger::move($fisherman->id, $sellerCents, 'catch_sale', $id);
            if ($fee > 0) {
                \App\Services\AccountLedger::move($rider->id, $fee, 'delivery_fee', $id);
            }
            // Platform funds are recorded separately, never assigned to an arbitrary admin user.
            DB::table('order_settlements')->insert([
                'order_id' => $id, 'funded_amount' => \App\Services\AccountLedger::decimal($funded),
                'fisherman_amount' => $fishermanShare, 'rider_amount' => \App\Services\AccountLedger::decimal($fee),
                'platform_fee' => \App\Services\AccountLedger::decimal($platformCents),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            foreach ([$fisherman, $rider] as $recipient) {
                if ($recipient && $recipient->contact_number) {
                    SendSmsNotification::enqueue($recipient->contact_number, 'IsdaLog: ₱'.number_format((float) ($recipient->id === $fisherman->id ? $fishermanShare : \App\Services\AccountLedger::decimal($fee)), 2).' has been credited for Order #'.$id);
                }
            }

            // 3. Persist Formal Review Records
            $fRating = $validated['fisherman_rating'] ?? $validated['rating'] ?? 5;
            OrderReview::create([
                'order_id' => $order->id,
                'reviewer_id' => $currentUser->id,
                'reviewee_id' => $order->fisherman_id,
                'target_type' => 'fisherman',
                'rating' => $fRating,
                'comment' => $validated['fisherman_comment'] ?? null,
            ]);

            if ($order->rider_id && ! empty($validated['rider_rating'])) {
                OrderReview::create([
                    'order_id' => $order->id,
                    'reviewer_id' => $currentUser->id,
                    'reviewee_id' => $order->rider_id,
                    'target_type' => 'rider',
                    'rating' => $validated['rider_rating'],
                    'comment' => $validated['rider_comment'] ?? null,
                ]);
            }

            // 4. Update Order Status
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                    'picked_up_at' => $pickupConfirmed ? now() : $order->picked_up_at,
                    'escrow_balance' => 0.00,
                    'rating' => $fRating,
                    'updated_at' => now(),
                ]);

            \App\Services\TransactionNotifications::order((int) $order->id, 'settled', 'Order settlement recorded', 'Order #'.$order->id.' was confirmed and its internal wallet distribution recorded. This is not an external payout receipt.');
            // 5. Broadcast Real-Time WebSocket Telemetry
            DB::afterCommit(fn () => event(new CargoStatusUpdated((int) $order->id, 'completed', null)));

            return redirect()->back()->with('success', 'Inspection verified! ₱'.number_format((float) $fishermanShare, 2).' released to harvester.');
        });
    }
}
