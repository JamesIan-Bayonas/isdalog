<?php
// File: tests/Feature/BuyerDashboardMetricsTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BuyerDashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_dashboard_hydrates_dynamic_kpi_metrics_and_active_shipments(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role'           => 'buyer',
            'wallet_balance' => 8800.00,
        ]);

        // Active listing with a placed bid
        $activeListing = Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Mullet',
            'weight_kg'      => 20.00,
            'starting_price' => 5000.00,
            'current_bid'    => 5500.00,
            'location'       => 'Dipolog Port',
            'status'         => 'active',
        ]);

        DB::table('bids')->insert([
            'listing_id' => $activeListing->id,
            'buyer_id'   => $buyer->id,
            'amount'     => 5500.00,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Completed listing converted to an in-transit order
        $awardedListing = Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Scad',
            'weight_kg'      => 5.00,
            'starting_price' => 700.00,
            'current_bid'    => 700.00,
            'location'       => 'Galas Port',
            'status'         => 'completed',
        ]);

        DB::table('orders_logistics')->insert([
            'listing_id'     => $awardedListing->id,
            'user_id'        => $buyer->id,
            'fisherman_id'   => $fisherman->id,
            'rider_id'       => null,
            'final_price'    => 700.00,
            'escrow_balance' => 700.00,
            'delivery_otp'   => '368989',
            'logistics_type' => 'request_rider',
            'status'         => 'en_route',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $response = $this->actingAs($buyer)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('role', 'buyer')
            ->where('metrics.activeBids', 1)
            ->where('metrics.wonAuctions', 1)
            ->where('metrics.walletBalance', 8800)
            ->where('metrics.escrowLocked', 700)
            ->has('activeShipments', 1)
            ->where('activeShipments.0.delivery_otp', '368989')
        );
    }
}