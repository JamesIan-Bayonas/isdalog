<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_rider_can_view_dispatch_board(): void
    {
        /** @var User $rider */
        $rider = User::factory()->create([
            'role' => 'rider',
            'status' => 'verified',
        ]);

        $response = $this->actingAs($rider)->get('/dispatch');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dispatch')
            ->has('availableJobs')
            ->has('activeRuns')
            ->where('riderStatus', 'verified')
        );
    }

    public function test_unverified_rider_cannot_claim_cargo(): void
    {
        /** @var User $rider */
        $rider = User::factory()->create([
            'role' => 'rider',
            'status' => 'unverified',
        ]);
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);
        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);
        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Blue Marlin',
            'weight_kg' => 40.00,
            'starting_price' => 4000.00,
            'current_bid' => 4000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);
        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 4000.00,
            'escrow_balance' => 4000.00,
            'pickup_otp' => '123456',
            'delivery_otp' => '654321',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '123456',
        ]);
        $response->assertSessionHasErrors('error');
        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'status' => 'pending_dispatch',
            'rider_id' => null,
        ]);
    }

    public function test_verified_rider_can_claim_available_cargo(): void
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
            'fish_name' => 'Yellowfin Tuna',
            'weight_kg' => 25.00,
            'starting_price' => 2500.00,
            'current_bid' => 2500.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
        'listing_id' => $listing->id,
        'user_id' => $buyer->id,
        'fisherman_id' => $fisherman->id,
        'rider_id' => null,
        'final_price' => 2500.00,
        'escrow_balance' => 2500.00,
        'pickup_otp' => '123456',
        'delivery_otp' => '654321',
        'logistics_type' => 'request_rider',
        'status' => 'pending_dispatch',
        'created_at' => now(),
        'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
        'pickup_otp' => '123456',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'rider_id' => $rider->id,
            'status' => 'en_route',
        ]);
    }

    public function test_assigned_rider_can_mark_cargo_as_delivered(): void
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
        'rider_id' => $rider->id,
        'final_price' => 1200.00,
        'escrow_balance' => 1200.00,
        'pickup_otp' => '111111',
        'delivery_otp' => '654321',
        'logistics_type' => 'request_rider',
        'status' => 'en_route',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/deliver", [
        'delivery_otp' => '654321',
    ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'status' => 'delivered',
        ]);
    }

    public function test_unauthorized_rider_cannot_mark_cargo_as_delivered(): void
    {
        /** @var User $assignedRider */
        $assignedRider = User::factory()->create(['role' => 'rider', 'status' => 'verified']);

        /** @var User $unauthorizedRider */
        $unauthorizedRider = User::factory()->create(['role' => 'rider', 'status' => 'verified']);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Bangus',
            'weight_kg' => 15.00,
            'starting_price' => 1500.00,
            'current_bid' => 1500.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
        'listing_id' => $listing->id,
        'user_id' => $buyer->id,
        'fisherman_id' => $fisherman->id,
        'rider_id' => $assignedRider->id,
        'final_price' => 1500.00,
        'escrow_balance' => 1500.00,
        'pickup_otp' => '111111',
        'delivery_otp' => '654321',
        'logistics_type' => 'request_rider',
        'status' => 'en_route',
        'created_at' => now(),
        'updated_at' => now(),
    ]);

        $response = $this->actingAs($unauthorizedRider)->post("/dispatch/orders/{$orderId}/deliver", [
        'delivery_otp' => '654321',
    ]);

        $response->assertSessionHasErrors('error');
        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'status' => 'en_route',
            'rider_id' => $assignedRider->id,
        ]);
    }
}