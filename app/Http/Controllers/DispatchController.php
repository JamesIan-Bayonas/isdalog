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

        // Simulated open delivery contracts pool for presentation visualization
        $mockJobs = [
            [
                'id' => 201,
                'species' => 'Tilapia Crate #3',
                'weight' => '35 KG',
                'origin' => 'Galas Port (Pier 1)',
                'destination' => 'Dipolog Public Market Market Stall #5',
                'payout' => '₱300.00'
            ],
            [
                'id' => 202,
                'species' => 'Premium Tuna Hull',
                'weight' => '18 KG',
                'origin' => 'Turno Port',
                'destination' => 'Estaka Restaurant Row Hub',
                'payout' => '₱250.00'
            ]
        ];

        return Inertia::render('Dispatch', [
            'riderStatus' => $user->status ?? 'unverified',
            'riderMetadata' => [
                'license' => $user->license_number,
                'vehicle' => $user->vehicle_plate,
            ],
            'jobs' => $mockJobs
        ]);
    }

    public function submitVerification(Request $request)
    {
        $request->validate([
            'license_number' => 'required|string|max:50',
            'vehicle_plate' => 'required|string|max:20',
        ]);

        $user = User::find(Auth::id());
        
        // Save form submission to user variables and change status state 
        $user->update([
            'license_number' => $request->license_number,
            'vehicle_plate' => $request->vehicle_plate, 
            'status' => 'pending_review'
        ]);

        return redirect()->back();
    }
}