<?php

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
    public function confirm(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'rating'            => ['nullable', 'integer', 'min:1', 'max:5'],
            'fisherman_rating'  => ['nullable', 'integer', 'min:1', 'max:5'],
            'fisherman_comment' => ['nullable', 'string', 'max:500'],
            'rider_rating'      => ['nullable', 'integer', 'min:1', 'max:5'],
            'rider_comment'     => ['nullable', 'string', 'max:500'],
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

            if ((int) $order->user_id !== (int) $currentUser->id) {
                return redirect()->back()->withErrors(['error' => 'Unauthorized. Only the buyer who ordered this catch can release escrow.']);
            }

            if ($order->status === 'completed') {
                return redirect()->back()->withErrors(['error' => 'This order has already been finalized and settled.']);
            }

            $catchPrice    = (float) $order->final_price;
            $deliveryFee   = (float) ($order->delivery_fee ?? 0);
            $fishermanShare = round($catchPrice * 0.97, 2);
            $riderShare     = $deliveryFee;

            // 1. Credit Fisherman Wallet Balance (97% Catch Price)
            $fisherman = User::find($order->fisherman_id);
            if ($fisherman) {
                $fisherman->increment('wallet_balance', $fishermanShare);

                if (! empty($fisherman->contact_number)) {
                    SendSmsNotification::dispatch(
                        $fisherman->contact_number,
                        "IsdaLog Escrow Released: ₱" . number_format($fishermanShare, 2) . " has been credited to your wallet for Order #{$order->id}."
                    );
                }
            }

            // 2. Credit Rider Wallet Balance (100% Delivery Fee)
            if ($order->rider_id && $riderShare > 0) {
                $rider = User::find($order->rider_id);
                if ($rider) {
                    $rider->increment('wallet_balance', $riderShare);

                    if (! empty($rider->contact_number)) {
                        SendSmsNotification::dispatch(
                            $rider->contact_number,
                            "IsdaLog Delivery Payout: ₱" . number_format($riderShare, 2) . " credited to your wallet for completing Order #{$order->id}."
                        );
                    }
                }
            }

            // 3. Persist Formal Review Records
            $fRating = $validated['fisherman_rating'] ?? $validated['rating'] ?? 5;
            OrderReview::create([
                'order_id'    => $order->id,
                'reviewer_id' => $currentUser->id,
                'reviewee_id' => $order->fisherman_id,
                'target_type' => 'fisherman',
                'rating'      => $fRating,
                'comment'     => $validated['fisherman_comment'] ?? null,
            ]);

            if ($order->rider_id && ! empty($validated['rider_rating'])) {
                OrderReview::create([
                    'order_id'    => $order->id,
                    'reviewer_id' => $currentUser->id,
                    'reviewee_id' => $order->rider_id,
                    'target_type' => 'rider',
                    'rating'      => $validated['rider_rating'],
                    'comment'     => $validated['rider_comment'] ?? null,
                ]);
            }

            // 4. Update Order Status
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status'         => 'completed',
                    'escrow_balance' => 0.00,
                'rating'         => $fRating,
                    'updated_at'     => now(),
                ]);

            // 5. Broadcast Real-Time WebSocket Telemetry
            event(new CargoStatusUpdated((int) $order->id, 'completed', null));

            return redirect()->back()->with('success', 'Inspection verified! ₱' . number_format($fishermanShare, 2) . ' released to harvester.');
        });
    }
}