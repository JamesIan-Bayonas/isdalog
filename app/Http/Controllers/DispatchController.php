<?php // File: isdalog/app/Http/Controllers/DispatchController.php

namespace App\Http\Controllers;

use App\Events\CargoStatusUpdated;
use App\Events\RiderLocationUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DispatchController extends Controller
{
    /**
     * Display the dispatch board with available jobs and active custody runs.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        abort_unless(in_array($user->role, ['rider', 'admin'], true), 403);

        // 1. Fetch unassigned jobs awaiting courier claim
        $availableJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->whereNull('orders_logistics.rider_id')
            ->where('orders_logistics.status', 'pending_dispatch')
            ->where('orders_logistics.logistics_type', 'request_rider')
            ->where(fn ($q) => $q->where('orders_logistics.delivery_details_required', false)->orWhereNotNull('orders_logistics.delivery_details_saved_at'))
            ->select([
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.destination_area',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'fishermen.name as fisherman_name',
                'buyers.name as buyer_name',
                'orders_logistics.created_at',
            ])
            ->orderByDesc('orders_logistics.created_at')
            ->get();

        // 2. Fetch active runs assigned to this courier
        $activeRuns = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->where('orders_logistics.rider_id', $user->id)
            ->whereIn('orders_logistics.status', ['en_route', 'delivered'])
            ->select([
                'orders_logistics.delivery_address', 'orders_logistics.recipient_name', 'orders_logistics.recipient_phone', 'orders_logistics.delivery_instructions',
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'orders_logistics.status',
                'fishermen.name as fisherman_name',
                'fishermen.contact_number as fisherman_contact',
                'buyers.name as buyer_name',
                'buyers.contact_number as buyer_contact',
                'orders_logistics.created_at',
            ])
            ->orderByDesc('orders_logistics.updated_at')
            ->get();

        return Inertia::render('Dispatch', [
            'availableJobs' => $availableJobs,
            'activeRuns' => $activeRuns,
            'riderStatus' => $user->status,
        ]);
    }

    /**
     * Courier claims cargo from harvester using the Harvester's Pickup OTP.
     */
    public function claim(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'pickup_otp' => ['required', 'string', 'regex:/^[0-9]{6}$/D'],
        ]);

        $user = $request->user();

        abort_unless($user->role === 'rider', 403);
        if ($user->status !== 'verified') {
            return redirect()->back()->withErrors([
                'error' => 'Your rider account is unverified. Compliance verification is required before claiming cargo.',
            ]);
        }

        return DB::transaction(function () use ($validated, $id, $user) {
            $order = DB::table('orders_logistics')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return redirect()->back()->withErrors(['error' => 'Order record not found.']);
            }

            if ($order->logistics_type !== 'request_rider' || $order->status !== 'pending_dispatch' || ! is_null($order->rider_id)) {
                return redirect()->back()->withErrors(['error' => 'This cargo run has already been claimed or dispatched.']);
            }

            if ($order->delivery_details_required && !$order->delivery_details_saved_at) return back()->withErrors(['error' => 'The buyer must save delivery details before pickup can be claimed.']);

            if (! hash_equals((string) $order->pickup_otp, $validated['pickup_otp'])) {
                return redirect()->back()->withErrors(['pickup_otp' => 'Invalid Handshake Pickup OTP. Verify code with harvester.']);
            }

            // Bind order to this rider and transition to en_route
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'rider_id' => $user->id,
                    'status' => 'en_route',
                    'picked_up_at' => now(),
                    'updated_at' => now(),
                ]);

            \App\Services\TransactionNotifications::order((int) $order->id, 'claimed', 'Courier assigned', 'Order #'.$order->id.' has been collected by its assigned courier.');
            // Real-time WebSocket dispatch
            DB::afterCommit(fn () => event(new CargoStatusUpdated((int) $order->id, 'en_route', $user->name)));

            // Notify buyer via Cellular SMS
            $buyer = User::find($order->user_id);
            if ($buyer && ! empty($buyer->contact_number)) {
                SendSmsNotification::enqueue(
                    $buyer->contact_number,
                    "IsdaLog Logistics: Courier {$user->name} has picked up your catch. Cargo is now EN ROUTE to your delivery destination."
                );
            }

            return redirect()->back()->with('success', 'Cargo claimed successfully. Proceed to delivery destination.');
        });
    }

    /**
     * Courier delivers cargo to buyer using Buyer's Delivery OTP.
     */
    public function deliver(Request $request, int $id): RedirectResponse
    {
        abort_unless($request->user()->role === 'rider' && $request->user()->status === 'verified', 403);
        $validated = $request->validate([
            'delivery_otp' => ['required', 'string', 'regex:/^[0-9]{6}$/D'],
        ]);

        $user = $request->user();

        return DB::transaction(function () use ($validated, $id, $user) {
            $order = DB::table('orders_logistics')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return redirect()->back()->withErrors(['error' => 'Order record not found.']);
            }

            if ((int) $order->rider_id !== (int) $user->id) {
                return redirect()->back()->withErrors(['error' => 'Unauthorized action. You are not assigned to this cargo run.']);
            }

            if ($order->logistics_type !== 'request_rider' || $order->status !== 'en_route') {
                return redirect()->back()->withErrors(['error' => 'Order is not currently in transit.']);
            }

            if (! hash_equals((string) $order->delivery_otp, $validated['delivery_otp'])) {
                return redirect()->back()->withErrors(['delivery_otp' => 'Invalid Delivery Confirmation OTP. Verify code with recipient buyer.']);
            }

            // Mark cargo as delivered (awaiting final buyer inspection & rating)
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status' => 'delivered',
                    'delivered_at' => now(),
                    'updated_at' => now(),
                ]);

            \App\Services\TransactionNotifications::order((int) $order->id, 'delivered', 'Delivery recorded', 'Order #'.$order->id.' is marked delivered and awaits buyer receipt confirmation. Settlement has not yet been confirmed.');
            // Broadcast real-time delivery arrival
            DB::afterCommit(fn () => event(new CargoStatusUpdated((int) $order->id, 'delivered', $user->name)));

            return redirect()->back()->with('success', 'Cargo marked as delivered. Awaiting buyer inspection and escrow payout release.');
        });
    }

    /**
     * Broadcast live GPS telemetry coordinates from courier mobile client.
     */
    public function updateLocation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $user = $request->user();

        abort_unless($user->role === 'rider' && $user->status === 'verified', 403);

        return DB::transaction(function () use ($validated, $id, $user) {
            $order = DB::table('orders_logistics')->where('id', $id)->lockForUpdate()->first();
            if (! $order || (int) $order->rider_id !== (int) $user->id || $order->status !== 'en_route' || $order->logistics_type !== 'request_rider') {
                return response()->json(['status' => 'error', 'message' => 'Unauthorized GPS update.'], 403);
            }
            DB::table('orders_logistics')->where('id', $id)->update([
                'courier_latitude' => $validated['latitude'], 'courier_longitude' => $validated['longitude'], 'location_recorded_at' => now(),
            ]);
            DB::afterCommit(fn () => event(new RiderLocationUpdated($id, (float) $validated['latitude'], (float) $validated['longitude'])));

            return response()->json(['status' => 'success']);
        });
    }

    public function telemetry(Request $request, int $id): JsonResponse
    {
        $order = DB::table('orders_logistics')->where('id', $id)->first();
        abort_unless($order && ($request->user()->role === 'admin' || in_array((int) $request->user()->id,
            [(int) $order->user_id, (int) $order->fisherman_id, (int) $order->rider_id], true)), 403);
        $recorded = $order->location_recorded_at ? \Illuminate\Support\Carbon::parse($order->location_recorded_at) : null;

        return response()->json(['order_id' => $id, 'status' => $order->status,
            'latitude' => $order->courier_latitude === null ? null : (float) $order->courier_latitude,
            'longitude' => $order->courier_longitude === null ? null : (float) $order->courier_longitude,
            'recorded_at' => $recorded?->toISOString(), 'server_now' => now()->toISOString(),
            'location_state' => ! $recorded ? 'unavailable' : ($recorded->lt(now()->subMinutes(2)) ? 'stale' : 'recent'),
        ])->header('Cache-Control', 'private, no-store');
    }
}
