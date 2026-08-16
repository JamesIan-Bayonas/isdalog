<?php

namespace App\Http\Controllers;

use App\Events\CargoStatusUpdated;
use App\Events\RiderLocationUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DispatchController extends Controller
{
    /**
     * Render the Logistics Dispatch Board.
     */
    public function index(Request $request): Response
    {
        /** @var User $rider */
        $rider = $request->user();

        if ($rider->role !== 'rider') {
            abort(403, 'Unauthorized. Logistics Courier role required.');
        }

        $availableJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->where('orders_logistics.status', 'pending_dispatch')
            ->where('orders_logistics.logistics_type', 'request_rider')
            ->select(
                'orders_logistics.id as order_id',
                'orders_logistics.final_price',
                'orders_logistics.delivery_fee',
                'orders_logistics.created_at',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location as origin_port',
                'fishermen.name as fisherman_name',
                'fishermen.contact_number as fisherman_contact',
                'buyers.name as buyer_name',
                'buyers.contact_number as buyer_contact'
            )
            ->orderBy('orders_logistics.created_at', 'asc')
            ->get();

        $activeRuns = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->join('users as fishermen', 'orders_logistics.fisherman_id', '=', 'fishermen.id')
            ->join('users as buyers', 'orders_logistics.user_id', '=', 'buyers.id')
            ->where('orders_logistics.rider_id', $rider->id)
            ->whereIn('orders_logistics.status', ['en_route', 'delivered'])
            ->select(
                'orders_logistics.id as order_id',
                'orders_logistics.status',
                'orders_logistics.final_price',
                'orders_logistics.created_at',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location as origin_port',
                'fishermen.name as fisherman_name',
                'buyers.name as buyer_name',
                'buyers.contact_number as buyer_contact'
            )
            ->orderBy('orders_logistics.updated_at', 'desc')
            ->get();

        return Inertia::render('Dispatch', [
            'availableJobs' => $availableJobs,
            'activeRuns' => $activeRuns,
            'riderStatus' => $rider->status,
        ]);
    }

    /**
     * Courier claims cargo from port by verifying harvester's pickup OTP.
     */
    public function claim(Request $request, int $orderId): RedirectResponse
    {
        /** @var User $rider */
        $rider = Auth::user();

        if ($rider->role !== 'rider' || $rider->status !== 'verified') {
            return redirect()->back()->withErrors(['error' => 'Unverified riders are unauthorized to claim port cargo.']);
        }

        $validated = $request->validate([
            'pickup_otp' => ['required', 'string', 'size:6'],
        ]);

        $order = DB::table('orders_logistics')->where('id', $orderId)->first();

        if (! $order || $order->status !== 'pending_dispatch') {
            return redirect()->back()->withErrors(['error' => 'Order is no longer available for claiming.']);
        }

        if ($order->pickup_otp !== $validated['pickup_otp']) {
            return redirect()->back()->withErrors(['pickup_otp' => 'Invalid Port Pickup OTP code.']);
        }

        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'rider_id' => $rider->id,
                'status' => 'en_route',
                'updated_at' => now(),
            ]);

        event(new CargoStatusUpdated($orderId, 'en_route', $rider->name));

        // Asynchronous Queued SMS Notification to Buyer
        $buyer = User::find($order->user_id);
        $listing = DB::table('listings')->where('id', $order->listing_id)->first();
        if ($buyer && ! empty($buyer->contact_number)) {
            SendSmsNotification::dispatch(
                $buyer->contact_number,
                "IsdaLog Delivery Update: Courier {$rider->name} has collected your {$listing->fish_name} cargo from Galas Port. Package is EN ROUTE."
            )->afterCommit();
        }

        return redirect()->back()->with('success', 'Cargo claimed successfully. Proceed to delivery destination.');
    }

    /**
     * Ingests real-time GPS telemetry from active couriers and broadcasts it to buyers.
     */
    public function updateLocation(Request $request, int $orderId): JsonResponse
    {
        /** @var User $rider */
        $rider = Auth::user();

        $validated = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $order = DB::table('orders_logistics')->where('id', $orderId)->first();

        if (! $order || (int) $order->rider_id !== (int) $rider->id || $order->status !== 'en_route') {
            return response()->json(['error' => 'Unauthorized or invalid order status for telemetry.'], 403);
        }

        event(new RiderLocationUpdated($orderId, (float) $validated['latitude'], (float) $validated['longitude']));

        return response()->json(['status' => 'success']);
    }

    /**
     * Courier delivers cargo to buyer by verifying buyer's delivery OTP.
     */
    public function deliver(Request $request, int $orderId): RedirectResponse
    {
        /** @var User $rider */
        $rider = Auth::user();

        $validated = $request->validate([
            'delivery_otp' => ['required', 'string', 'size:6'],
        ]);

        $order = DB::table('orders_logistics')->where('id', $orderId)->first();

        if (! $order || (int) $order->rider_id !== (int) $rider->id) {
            return redirect()->back()->withErrors(['error' => 'Unauthorized delivery attempt.']);
        }

        if ($order->delivery_otp !== $validated['delivery_otp']) {
            return redirect()->back()->withErrors(['delivery_otp' => 'Invalid Buyer Handshake Delivery OTP code.']);
        }

        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'delivered',
                'updated_at' => now(),
            ]);

        event(new CargoStatusUpdated($orderId, 'delivered', $rider->name));

        // Asynchronous Queued SMS Notification to Buyer
        $buyer = User::find($order->user_id);
        if ($buyer && ! empty($buyer->contact_number)) {
            SendSmsNotification::dispatch(
                $buyer->contact_number,
                "IsdaLog Arrived: Cargo for Order #{$order->id} has been delivered by {$rider->name}. Please inspect goods and confirm receipt on terminal."
            )->afterCommit();
        }

        return redirect()->back()->with('success', 'Handshake completed. Cargo marked as delivered.');
    }
}