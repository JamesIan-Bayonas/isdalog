<?php

namespace Tests\Feature;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class HarvesterDashboardTelemetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_harvester_dashboard_displays_stats_pickup_otp_and_telemetry_logs(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'name'           => 'Juan Harvester',
            'role'           => 'fisherman',
            'wallet_balance' => 5000.00,
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'name' => 'Market Buyer',
            'role' => 'buyer',
        ]);

        // 1. Biological Catch Log
        FishCatch::create([
            'user_id'           => $fisherman->id,
            'species'           => 'Yellowfin Tuna',
            'weight'            => 45.00,
            'location'          => 'Galas Port',
            'wind_speed'        => 12.50,
            'temperature'       => 28.00,
            'weather_condition' => 'WMO-0',
            'logged_at'         => now(),
        ]);

        // 2. Active Listing
        $listing = Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Yellowfin Tuna Batch',
            'weight_kg'      => 45.00,
            'starting_price' => 4500.00,
            'current_bid'    => 4500.00,
            'location'       => 'Galas Port',
            'status'         => 'completed',
        ]);

        // 3. Consignment Order with Handshake Pickup OTP
        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id'     => $listing->id,
            'user_id'        => $buyer->id,
            'fisherman_id'   => $fisherman->id,
            'rider_id'       => null,
            'final_price'    => 4500.00,
            'delivery_fee'   => 150.00,
            'escrow_balance' => 4500.00,
            'pickup_otp'     => '987654', // Handshake Token PIN
            'delivery_otp'   => '123456',
            'logistics_type' => 'request_rider',
            'status'         => 'pending_dispatch',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $response = $this->actingAs($fisherman)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('role', 'fisherman')
            ->where('stats.loggedBiomass', 45)
            ->where('stats.escrowInTransit', 4365) // 97% of ₱4500
            ->has('consignmentLedger', 1)
            ->where('consignmentLedger.0.order_id', $orderId)
            ->where('consignmentLedger.0.pickup_otp', '987654')
            ->where('consignmentLedger.0.buyer_name', 'Market Buyer')
            ->has('telemetryLogs', 1)
            ->where('telemetryLogs.0.species', 'Yellowfin Tuna')
        );
    }
}