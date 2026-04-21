<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\Listing;

class OrderController extends Controller
{
    public function checkout(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);

        // Merchant locks in the delivery request. We MUST record Auth::id() as the merchant.
        DB::table('orders_logistics')->insert([
            'listing_id' => $listing->id,
            'merchant_id' => Auth::id(), 
            'status' => 'finding_rider',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Remove the listing from the active marketplace
        $listing->update(['status' => 'sold']);

        return redirect()->route('marketplace.index')->with('success', 'Logistics arranged! Waiting for a rider.');
    }

    // 4. Merchant Confirms & Rates the Delivery (The Trust Ledger)
    public function confirmReceipt(Request $request, $orderId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5'
        ]);

        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'completed',
                'merchant_rating' => $request->rating,
                'updated_at' => now()
            ]);

        return redirect()->back()->with('success', 'Transaction completely closed! Thank you.');
    }
}