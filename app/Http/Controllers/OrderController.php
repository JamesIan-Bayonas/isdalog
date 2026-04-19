<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Listing;

class OrderController extends Controller
{
    public function checkout(Request $request, $id)
    {
        $listing = Listing::findOrFail($id);

        // Merchant locks in the delivery request
        DB::table('orders_logistics')->insert([
            'listing_id' => $listing->id,
            'status' => 'finding_rider',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('marketplace.index')->with('success', 'Logistics arranged! Waiting for a rider.');
    }

    // 4. Merchant Confirms & Rates the Delivery
    public function confirmReceipt(\Illuminate\Http\Request $request, $orderId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5'
        ]);

        \Illuminate\Support\Facades\DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'completed',
                'merchant_rating' => $request->rating,
                'updated_at' => now()
            ]);

        return redirect()->back()->with('success', 'Transaction completely closed! Thank you.');
    }
}