<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        return Inertia::render('Dashboard', [
            'stats' => [
                'total_listings' => 14,
                'total_volume_kg' => 385,
                'active_fishermen' => 8,
                'total_bids_placed' => 42
            ],
            'recentActivity' => [
                [
                    'id' => 1,
                    'message' => 'Fisherman James Ian logged 15kg of Tilapia via Telegram',
                    'time' => '2 mins ago',
                    'location' => 'Galas Port'
                ],
                [
                    'id' => 2,
                    'message' => 'Merchant Maria placed a bid of ₱3,500 on Listing #104',
                    'time' => '12 mins ago',
                    'location' => 'Dipolog Central Market'
                ],
                [
                    'id' => 3,
                    'message' => 'Local Edge AI automatically verified a catch of Lapu-Lapu',
                    'time' => '1 hour ago',
                    'location' => 'Turno Port'
                ]
            ]
        ]);
    }
}