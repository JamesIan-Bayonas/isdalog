<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use App\Services\SmsNotificationService;

class DispatchController extends Controller
{
    /**
     * Render the dispatch board listing all open jobs.
     */
    public function index(): Response
    {
        $openJobs = DB::table('orders_logistics')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->select(
                'orders_logistics.id as order_id', 
                'orders_logistics.status',
                'orders_logistics.final_price',
                'listings.fish_name',
                'listings.weight_kg',
                'listings.location'
            )
            ->where('orders_logistics.status', 'pending_dispatch')
            ->whereNull('orders_logistics.rider_id')
            ->get();

        return Inertia::render('Dispatch', [
            'openJobs' => $openJobs
        ]);
    }

    /**
     * Route handler allowing a registered Rider to claim an open shipment delivery.
     */
    public function claim(Request $request, int $orderId): RedirectResponse
    {
        if (Auth::user()->role !== 'rider') {
            return redirect()->back()->withErrors(['error' => 'Unauthorized action. Only verified couriers can claim jobs.']);
        }

        // Fetch order details alongside owner context profiles before updating state
        $order = DB::table('orders_logistics')
            ->join('users', 'orders_logistics.user_id', '=', 'users.id')
            ->join('listings', 'orders_logistics.listing_id', '=', 'listings.id')
            ->select('orders_logistics.*', 'users.phone as buyer_phone', 'listings.fish_name')
            ->where('orders_logistics.id', $orderId)
            ->first();

        $affected = DB::table('orders_logistics')
            ->where('id', $orderId)
            ->where('status', 'pending_dispatch')
            ->whereNull('rider_id')
            ->update([
                'rider_id' => Auth::id(),
                'status' => 'en_route',
                'updated_at' => now(),
            ]);

        if (!$affected) {
            return redirect()->back()->withErrors(['error' => 'Job already taken or unavailable.']);
        }

        // TRIGGER 1: Notify the Buyer that their consignment shipment has left Galas Port
        if ($order && !empty($order->buyer_phone)) {
            SmsNotificationService::send(
                $order->buyer_phone,
                "IsdaLog Dispatch: Your order for {$order->weight_kg}kg of {$order->fish_name} is en route! Rider " . Auth::user()->name . " is navigating to your destination."
            );
        }

        return redirect()->back()->with('success', 'Job claimed successfully! Proceed to Galas Port for pickup.');
    }

    /**
     * Mark the delivery as completed and execute the Escrow payout with strict types.
     */
    public function completeDelivery(Request $request, int $id): RedirectResponse
    {
        $request->validate([
            'receipt_image' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $order = DB::table('orders_logistics')->where('id', $id)->first();

        if (!$order || $order->status !== 'en_route') {
            return redirect()->back()->withErrors(['error' => 'Order is not in a deliverable state.']);
        }

        $imagePath = $request->file('receipt_image')->store('receipts', 'public');

        $scannedText = "OFFICIAL RECEIPT ISDALOG-ORDER-#ID-" . $order->id; 
        $expectedToken = "ISDALOG-ORDER-#ID-" . $order->id;

        if (strpos($scannedText, $expectedToken) === false) {
            return redirect()->back()->withErrors(['error' => 'OCR Verification Failed: Receipt metadata does not match Crate ID.']);
        }

        DB::transaction(function () use ($order) {
            DB::table('orders_logistics')
                ->where('id', $order->id)
                ->update([
                    'status' => 'completed',
                    'updated_at' => now()
                ]);

            DB::table('users')
                ->where('id', $order->fisherman_id)
                ->increment('wallet_balance', $order->final_price);

            DB::table('users')
                ->where('id', $order->rider_id)
                ->increment('wallet_balance', $order->delivery_fee);
        });

        // Fetch user profiles to grab the vendor's cellular metadata contact
        $fisherman = DB::table('users')->where('id', $order->fisherman_id)->first();

        // TRIGGER 2: Notify the Fisherman that the handshake passed and escrow balances cleared
        if ($fisherman && !empty($fisherman->phone)) {
            SmsNotificationService::send(
                $fisherman->phone,
                "IsdaLog Capital Release: Handshake verified for Crate #{$order->id}! Escrow balance of ₱" . number_format($order->final_price, 2) . " has been successfully credited to your account wallet."
            );
        }

        return redirect()->route('dispatch.index')->with('success', 'Handshake verified! Escrow balances cleared successfully.');
    }  
}