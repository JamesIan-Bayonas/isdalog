<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

class ListingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fish_name' => 'required|string|max:255',
            'weight_kg' => 'required|numeric|min:0.1',
            'starting_price' => 'required|numeric|min:1',
            'location' => 'required|string|max:255',
        ]);

        // Automatically assign to the logged-in fisherman
        Listing::create([
            'user_id' => Auth::id(), 
            'fish_name' => $validated['fish_name'],
            'weight_kg' => $validated['weight_kg'],
            'starting_price' => $validated['starting_price'],
            'current_bid' => $validated['starting_price'],
            'location' => $validated['location'],
            'status' => 'active',
        ]);

        // Redirect back to the dashboard. Inertia will update the UI instantly.
        return Redirect::route('dashboard')->with('success', 'Listing created successfully!');
    }
}