<?php // File: isdalog/app/Services/OrderTrace.php

namespace App\Services;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class OrderTrace
{
    private static function allowed($order, User $viewer): bool
    {
        return $viewer->role === 'admin' || in_array((int) $viewer->id, [(int) $order->user_id, (int) $order->fisherman_id, (int) $order->rider_id], true);
    }

    public static function forOrder(int $id, User $viewer): array
    {
        $order = DB::table('orders_logistics')->where('id', $id)->first();
        abort_unless($order && self::allowed($order, $viewer), 404);

        return self::build(Listing::findOrFail($order->listing_id), $order);
    }

    public static function forListing(Listing $listing, User $viewer): ?array
    {
        $order = DB::table('orders_logistics')->where('listing_id', $listing->id)->first();
        if ($order) {
            return self::allowed($order, $viewer) ? self::build($listing, $order) : null;
        }

        return $viewer->role === 'admin' || (int) $listing->user_id === (int) $viewer->id ? self::build($listing, null) : null;
    }

    private static function build(Listing $listing, $order): array
    {
        $events = [];
        $add = function (string $key, string $label, $at, string $detail) use (&$events) {
            $events[] = ['key' => $key, 'label' => $label, 'at' => $at ? Carbon::parse($at)->toISOString() : null, 'detail' => $detail];
        };
        $snapshot = $order && $order->sale_snapshot_at;
        $catchId = $snapshot ? $order->sale_catch_id : $listing->catch_id;
        $catch = $catchId ? FishCatch::whereKey($catchId)->where('user_id', $order->fisherman_id ?? $listing->user_id)->first() : null;
        if ($catch) {
            $add('catch_logged', 'Catch record logged', $catch->logged_at, 'Seller-reported catch data. Logging time does not establish harvest or landing time.');
        }
        $add('listing_created', 'Listing record created', $listing->created_at, 'A listing record was saved; this is not a freshness or handling certification.');
        foreach (DB::table('listing_activities')->where('listing_id', $listing->id)->whereIn('action', ['edited', 'withdrawn', 'expired'])->orderBy('id')->get(['id', 'action', 'created_at']) as $activity) {
            $add('listing_activity:'.$activity->id, ['edited' => 'Listing details edited', 'withdrawn' => 'Listing withdrawn', 'expired' => 'Listing expiry recorded'][$activity->action], $activity->created_at, 'Recorded listing activity; earlier values and event times are not inferred.');
        }
        if ($order) {
            $add('order_created', 'Order accepted; escrow recorded', $order->created_at, 'Internal order creation, not proof of an external payment.');
            if ($order->sale_snapshot_at) {
                $add('sale_snapshot', 'Sale details frozen', $order->sale_snapshot_at, 'Species label, landing reference, weight and explicit catch link captured at acceptance.');
            }
            if ($order->delivery_details_saved_at) {
                $add('destination_saved', 'Delivery details saved', $order->delivery_details_saved_at, 'Most recent saved destination details; address and recipient are omitted from this timeline.');
            }
            if ($order->picked_up_at) {
                $add('pickup', 'Pickup recorded', $order->picked_up_at, 'Handover recorded by the application; no storage-temperature evidence is implied.');
            }
            if ($order->delivered_at) {
                $add('delivery', 'Delivery recorded', $order->delivered_at, 'Delivery milestone saved; buyer confirmation is a separate event.');
            }
            if ($order->completed_at) {
                $add('confirmation', 'Buyer receipt confirmed', $order->completed_at, 'Application receipt confirmation; not a quality certificate.');
            }
            $settlement = DB::table('order_settlements')->where('order_id', $order->id)->first(['created_at']);
            if ($settlement) {
                $add('settlement', 'Internal settlement recorded', $settlement->created_at, 'Internal wallet allocation, not an external payout receipt.');
            }
            $issue = DB::table('order_issues')->where('order_id', $order->id)->first(['created_at', 'reviewed_at']);
            if ($issue) {
                $add('issue', 'Order issue reported', $issue->created_at, 'A participant requested review.');
                if ($issue->reviewed_at) {
                    $add('issue_reviewed', 'Issue review recorded', $issue->reviewed_at, 'Read the order issue panel for the decision.');
                }
            }
            $refund = DB::table('order_refunds')->where('order_id', $order->id)->first(['created_at']);
            if ($refund) {
                $add('refund', 'Reserved funds returned', $refund->created_at, 'Internal refund or cancellation recorded. No external reversal is claimed.');
            }
        }
        usort($events, fn ($a, $b) => ($a['at'] ?? '9999') <=> ($b['at'] ?? '9999'));

        return ['listing_id' => $listing->id, 'catch_id' => $catch?->id, 'order_id' => $order?->id, 'snapshot_at' => $order?->sale_snapshot_at,
            'catch_link_basis' => $snapshot ? 'acceptance_snapshot' : 'current_explicit_listing_link', 'events' => $events];
    }
}
