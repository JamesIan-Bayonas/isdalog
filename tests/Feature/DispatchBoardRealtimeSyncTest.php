<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DispatchBoardRealtimeSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_rider_receives_complete_payload_structures(): void
    {
        /** @var User $rider */
        $rider = User::factory()->create([
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'name' => 'Galas Harvester',
            'role' => 'fisherman',
            'contact_number' => '09171112222',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'name' => 'Market Buyer',
            'role' => 'buyer',
            'contact_number' => '09183334444',
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Yellowfin Tuna',
            'weight_kg' => 45.00,
            'starting_price' => 4500.00,
            'current_bid' => 4500.00,
            'location' => 'Galas Port (Dock 2)',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 4500.00,
            'escrow_balance' => 4500.00,
            'pickup_otp' => '334455',
            'delivery_otp' => '998877',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->get('/dispatch');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dispatch')
            ->has('availableJobs', 1)
            ->where('availableJobs.0.order_id', $orderId)
            ->where('availableJobs.0.fish_name', 'Yellowfin Tuna')
            ->where('availableJobs.0.fisherman_name', 'Galas Harvester')
            ->where('availableJobs.0.buyer_name', 'Market Buyer')
            ->has('activeRuns', 0)
            ->where('riderStatus', 'verified')
        );
    }

    public function test_claimed_order_moves_from_available_to_active_runs(): void
    {
        /** @var User $rider */
        $rider = User::factory()->create([
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu',
            'weight_kg' => 12.00,
            'starting_price' => 1200.00,
            'current_bid' => 1200.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 1200.00,
            'escrow_balance' => 1200.00,
            'pickup_otp' => '654321',
            'delivery_otp' => '123456',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $claimResponse = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '654321',
        ]);

        $claimResponse->assertRedirect();
        $claimResponse->assertSessionHasNoErrors();

        $dispatchViewResponse = $this->actingAs($rider)->get('/dispatch');
        $dispatchViewResponse->assertInertia(fn ($page) => $page
            ->component('Dispatch')
            ->has('availableJobs', 0)
            ->has('activeRuns', 1)
            ->where('activeRuns.0.order_id', $orderId)
            ->where('activeRuns.0.status', 'en_route')
        );
    }
}