<?php

// app/Http/Controllers/OrderConfirmationController.php
namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\OrderReview;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class OrderConfirmationController extends Controller
{
public function confirm(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'rider_rating'     => 'required|integer|min:1|max:5',
            'rider_comment'    => 'nullable|string|max:500',
            'fisherman_rating' => 'required|integer|min:1|max:5',
            'fisherman_comment'=> 'nullable|string|max:500',
        ]);

        return DB::transaction(function () use ($validated, $id, $request) {
            // Lock order record to prevent duplicate payouts from simultaneous clicks
            $order = Order::where('id', $id)->lockForUpdate()->firstOrFail();

            if ($order->status === 'completed') {
                return response()->json(['message' => 'Order is already settled.'], 400);
            }

            $catchPrice   = (float) $order->catch_price;
            $deliveryFee  = (float) $order->delivery_fee;

            $fishermanShare = round($catchPrice * 0.97, 2);
            $platformShare  = round($catchPrice * 0.03, 2);
            $riderShare      = $deliveryFee;

            // 1. Credit Fisherman Wallet (97%)
            $this->creditWallet(
                userId: $order->fisherman_id,
                orderId: $order->id,
                amount: $fishermanShare,
                purpose: 'catch_sale'
            );

            // 2. Credit Platform Wallet (3% Governance Fee)
            $platformAdmin = User::where('role', 'admin')->firstOrFail();
            $this->creditWallet(
                userId: $platformAdmin->id,
                orderId: $order->id,
                amount: $platformShare,
                purpose: 'platform_fee'
            );

            // 3. Credit Rider Wallet (100% Delivery Fee)
            if ($order->rider_id && $riderShare > 0) {
                $this->creditWallet(
                    userId: $order->rider_id,
                    orderId: $order->id,
                    amount: $riderShare,
                    purpose: 'delivery_fee'
                );
            }

            // 4. Save Reviews
            OrderReview::create([
                'order_id'    => $order->id,
                'reviewer_id' => $request->user()->id,
                'reviewee_id' => $order->fisherman_id,
                'target_type' => 'fisherman',
                'rating'      => $validated['fisherman_rating'],
                'comment'     => $validated['fisherman_comment'],
            ]);

            if ($order->rider_id) {
                OrderReview::create([
                    'order_id'    => $order->id,
                    'reviewer_id' => $request->user()->id,
                    'reviewee_id' => $order->rider_id,
                    'target_type' => 'rider',
                    'rating'      => $validated['rider_rating'],
                    'comment'     => $validated['rider_comment'],
                ]);
            }

            // 5. Update Order Status
            $order->update(['status' => 'completed']);

            return response()->json([
                'status'  => 'success',
                'message' => 'Order verified, funds distributed, and ratings submitted.',
                'settlement' => [
                    'fisherman_received' => $fishermanShare,
                    'platform_fee'       => $platformShare,
                    'rider_received'     => $riderShare,
                ]
            ]);
        });
    }

    private function creditWallet(int $userId, int $orderId, float $amount, string $purpose): void
    {
        $wallet = Wallet::firstOrCreate(['user_id' => $userId]);
        $wallet->balance += $amount;
        $wallet->save();

        WalletTransaction::create([
            'wallet_id'     => $wallet->id,
            'order_id'      => $orderId,
            'type'          => 'credit',
            'purpose'       => $purpose,
            'amount'        => $amount,
            'balance_after' => $wallet->balance,
        ]);
    }
}