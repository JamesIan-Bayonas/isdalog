<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class DispatchController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // 1. Fetch available logistics jobs from the database (Mocked for immediate presentation stability)
        $availableJobs = [
            [
                'id' => 101,
                'species' => 'Tilapia Crate A',
                'weight' => '45 KG',
                'origin' => 'Galas Port (Dock 2)',
                'destination' => 'Dipolog Central Market Stall #14',
                'payout' => '₱350.00',
                'status' => 'pending_pickup'
            ],
            [
                'id' => 102,
                'species' => 'Premium Lapu-Lapu',
                'weight' => '12 KG',
                'origin' => 'Turno Port',
                'destination' => 'Lee Plaza Seafood Restaurant',
                'payout' => '₱280.00',
                'status' => 'pending_pickup'
            ]
        ];

        // 2. Pass the user profile status directly down to the React Frontend component
        return Inertia::render('Dispatch', [
            'riderStatus' => $user->status ?? 'unverified', // unverified, pending_review, verified
            'riderMetadata' => [
                'license' => $user->license_number ?? null,
                'vehicle' => $user->vehicle_plate ?? null,
            ],
            'jobs' => $availableJobs
        ]);
    }

    // 3. Handle the incoming legal document verification payload upload
    public function submitVerification(Request $request)
    {
        $request->validate([
            'license_number' => 'required|string|max:50',
            'vehicle_plate' => 'required|string|max:20',
            'vehicle_type' => 'required|string',
        ]);

        $user = User::find(Auth::id());
        
        // Save metadata parameters into user records attributes field columns
        $user->update([
            'license_number' => $request->license_number,
            'vehicle_plate' => $request->vehicle_plate,
            'status' => 'pending_review' // Mutate state status gate lock
        ]);

        return redirect()->back()->with('success', 'Credentials submitted securely for administrative vetting.');
    }
}