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

    public function confirmReceipt(Request $request, $orderId)
    {
        // This is the data anchor for your future AI model!
        $request->validate([
            'rating' => 'required|integer|min:1|max:5'
        ]);

        DB::table('orders_logistics')
            ->where('id', $orderId)
            ->update([
                'status' => 'completed',
                'rating' => $request->rating, // Saves the 1-5 star rating
                'updated_at' => now(),
            ]);

        return redirect()->back()->with('success', 'Transaction complete. Thank you for rating!');
    }
}