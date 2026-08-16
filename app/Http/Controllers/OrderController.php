<?php

namespace App\Http\Controllers;

use App\Events\CargoStatusUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    /**
     * Store a new consignment order and lock buyer funds into escrow.
     */
    public function store(Request $request, Listing $listing): RedirectResponse
    {
        $validated = $request->validate([
            'logistics_type' => ['required', 'string', 'in:self_pickup,request_rider'],
        ]);

        /** @var User $buyer */
        $buyer = Auth::user();
        $finalPrice = (float) $listing->current_bid;

        if ($listing->status !== 'active') {
            return redirect()->back()->withErrors(['error' => 'This catch is no longer available for order.']);
        }

        $pickupOtp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $deliveryOtp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $orderId = DB::transaction(function () use ($buyer, $listing, $validated, $finalPrice, $pickupOtp, $deliveryOtp) {
            /** @var User $lockedBuyer */
            $lockedBuyer = User::where('id', $buyer->id)->lockForUpdate()->first();

            if ((float) $lockedBuyer->wallet_balance < $finalPrice) {
                return null;
            }

            $lockedBuyer->decrement('wallet_balance', $finalPrice);
            $listing->update(['status' => 'completed']);

            return DB::table('orders_logistics')->insertGetId([
                'listing_id' => $listing->id,
                'user_id' => $buyer->id,
                'fisherman_id' => $listing->user_id,
                'rider_id' => null,
                'final_price' => $finalPrice,
                'escrow_balance' => $finalPrice,
                'delivery_fee' => 0.00,
                'pickup_otp' => $pickupOtp,
                'delivery_otp' => $deliveryOtp,
                'logistics_type' => $validated['logistics_type'],
                'status' => 'pending_dispatch',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        if (! $orderId) {
            return redirect()->back()->withErrors(['error' => 'Insufficient virtual wallet balance to lock escrow.']);
        }

        // Asynchronous Queued SMS Notification to Harvester
        $fisherman = User::find($listing->user_id);
        if ($fisherman && ! empty($fisherman->contact_number)) {
            SendSmsNotification::dispatch(
                $fisherman->contact_number,
                "IsdaLog Alert: New consignment order #{$orderId} placed for {$listing->fish_name} ({$listing->weight_kg}kg). Handshake Pickup OTP for courier: {$pickupOtp}."
            )->afterCommit();
        }

        // Asynchronous Queued SMS Notification to Buyer
        if (! empty($buyer->contact_number)) {
            SendSmsNotification::dispatch(
                $buyer->contact_number,
                "IsdaLog Alert: Order #{$orderId} confirmed. Escrow ₱" . number_format($finalPrice, 2) . " locked. Your Delivery Confirmation OTP is: {$deliveryOtp}."
            )->afterCommit();
        }

        return redirect()->route('dashboard')->with('success', 'Order created and escrow secured successfully.');
    }

    /**
     * Confirm delivery arrival and release escrow balance to fisherman.
     */
    public function confirm(Request $request, int $orderId): RedirectResponse
    {
        $validated = $request->validate([
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        /** @var User $buyer */
        $buyer = Auth::user();

        $order = DB::table('orders_logistics')->where('id', $orderId)->first();

        if (! $order || (int) $order->user_id !== (int) $buyer->id) {
            return redirect()->back()->withErrors(['error' => 'Unauthorized order confirmation attempt.']);
        }

        if ($order->status !== 'delivered') {
            return redirect()->back()->withErrors(['error' => 'Cargo must be marked as delivered before releasing escrow.']);
        }

        $grossAmount = (float) $order->final_price;
        $netPayout = round($grossAmount * 0.97, 2);
        $platformFee = round($grossAmount * 0.03, 2);

        DB::transaction(function () use ($order, $netPayout, $platformFee, $validated) {
            User::where('id', $order->fisherman_id)->increment('wallet_balance', $netPayout);

            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status' => 'completed',
                    'escrow_balance' => 0.00,
                    'rating' => $validated['rating'] ?? null,
                    'updated_at' => now(),
                ]);
        });

        event(new CargoStatusUpdated($orderId, 'completed'));

        // Asynchronous Queued SMS Notification to Harvester
        $fisherman = User::find($order->fisherman_id);
        if ($fisherman && ! empty($fisherman->contact_number)) {
            SendSmsNotification::dispatch(
                $fisherman->contact_number,
                "IsdaLog Escrow Released: ₱" . number_format($netPayout, 2) . " has been credited to your virtual wallet for Order #{$order->id}."
            )->afterCommit();
        }

        return redirect()->back()->with('success', 'Consignment finalized and funds released to harvester.');
    }
}