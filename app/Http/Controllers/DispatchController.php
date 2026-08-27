<?php

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

        // 1. Fetch unassigned jobs awaiting courier claim
        $availableJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->whereNull('orders_logistics.rider_id')
            ->where('orders_logistics.status', 'pending_dispatch')
            ->where('orders_logistics.logistics_type', 'request_rider')
            ->select([
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'fishermen.name as fisherman_name',
                'fishermen.contact_number as fisherman_contact',
                'buyers.name as buyer_name',
                'buyers.contact_number as buyer_contact',
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
                'orders_logistics.id as order_id',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'orders_logistics.status',
                'orders_logistics.pickup_otp',
                'orders_logistics.delivery_otp',
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
            'activeRuns'    => $activeRuns,
            'riderStatus'   => $user->status,
        ]);
    }

    /**
     * Courier claims cargo from harvester using the Harvester's Pickup OTP.
     */
    public function claim(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'pickup_otp' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();

        // if ($user->status !== 'verified') {
        //     return redirect()->back()->withErrors([
        //         'error' => 'Your rider account is unverified. Compliance verification is required before claiming cargo.',
        //     ]);
        // }

        return DB::transaction(function () use ($validated, $id, $user) {
            $order = DB::table('orders_logistics')
                ->where('id', $id)
                ->lockForUpdate()
                ->first();

            if (! $order) {
                return redirect()->back()->withErrors(['error' => 'Order record not found.']);
            }

            if ($order->status !== 'pending_dispatch' || ! is_null($order->rider_id)) {
                return redirect()->back()->withErrors(['error' => 'This cargo run has already been claimed or dispatched.']);
            }

            if ((string) $order->pickup_otp !== (string) $validated['pickup_otp']) {
                return redirect()->back()->withErrors(['pickup_otp' => 'Invalid Handshake Pickup OTP. Verify code with harvester.']);
            }

            // Bind order to this rider and transition to en_route
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'rider_id'   => $user->id,
                    'status'     => 'en_route',
                    'updated_at' => now(),
                ]);

            // Real-time WebSocket dispatch
            event(new CargoStatusUpdated((int) $order->id, 'en_route', $user->name));

            // Notify buyer via Cellular SMS
            $buyer = User::find($order->user_id);
            if ($buyer && ! empty($buyer->contact_number)) {
                SendSmsNotification::dispatch(
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
        $validated = $request->validate([
            'delivery_otp' => ['required', 'string', 'size:6'],
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

            if ($order->status !== 'en_route') {
                return redirect()->back()->withErrors(['error' => 'Order is not currently in transit.']);
            }

            if ((string) $order->delivery_otp !== (string) $validated['delivery_otp']) {
                return redirect()->back()->withErrors(['delivery_otp' => 'Invalid Delivery Confirmation OTP. Verify code with recipient buyer.']);
            }

            // Mark cargo as delivered (awaiting final buyer inspection & rating)
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status'     => 'delivered',
                    'updated_at' => now(),
                ]);

            // Broadcast real-time delivery arrival
            event(new CargoStatusUpdated((int) $order->id, 'delivered', $user->name));

            return redirect()->back()->with('success', 'Cargo marked as delivered. Awaiting buyer inspection and escrow payout release.');
        });
    }

    /**
     * Broadcast live GPS telemetry coordinates from courier mobile client.
     */
    public function updateLocation(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $user = $request->user();

        $order = DB::table('orders_logistics')
            ->where('id', $id)
            ->first();

        if (! $order || (int) $order->rider_id !== (int) $user->id || $order->status !== 'en_route') {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized GPS broadcast.'], 403);
        }

        event(new RiderLocationUpdated(
            (int) $order->id,
            (float) $validated['latitude'],
            (float) $validated['longitude']
        ));

        return response()->json(['status' => 'success']);
    }
}