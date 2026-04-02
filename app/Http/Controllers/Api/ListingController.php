<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Listing;
use Illuminate\Http\Request;

class ListingController extends Controller
{
    public function index()
    {
        // Fetch all active listings, and include the fisherman's details so React can display their name
        $activeListings = Listing::with('fisherman')
                                 ->where('status', 'active')
                                 ->orderBy('created_at', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $activeListings
        ]);
    }
}