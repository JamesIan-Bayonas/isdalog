<?php

namespace Tests\Feature;

use App\Events\RiderLocationUpdated;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class LiveGpsTelemetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_courier_can_broadcast_gps_coordinates_during_active_run(): void
    {
        Event::fake([RiderLocationUpdated::class]);

        /** @var User $rider */
        $rider = User::factory()->create([
            'role' => 'rider',
            'status' => 'verified',
        ]);

        $listing = Listing::create([
            'user_id' => User::factory()->create(['role' => 'fisherman'])->id,
            'fish_name' => 'Tuna',
            'weight_kg' => 15.00,
            'starting_price' => 1000.00,
            'current_bid' => 1000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => User::factory()->create(['role' => 'buyer'])->id,
            'fisherman_id' => $listing->user_id,
            'rider_id' => $rider->id,
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
            'logistics_type' => 'request_rider',
            'status' => 'en_route',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->postJson("/dispatch/orders/{$orderId}/location", [
            'latitude' => 8.5800,
            'longitude' => 123.3300,
        ]);

        $response->assertOk();
        $response->assertJson(['status' => 'success']);

        Event::assertDispatched(RiderLocationUpdated::class, function ($event) use ($orderId) {
            return $event->orderId === $orderId 
                && $event->latitude === 8.5800 
                && $event->longitude === 123.3300;
        });
    }

    public function test_unauthorized_users_cannot_broadcast_gps_coordinates(): void
    {
        /** @var User $unauthorizedSniper */
        $unauthorizedSniper = User::factory()->create(['role' => 'buyer']);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => Listing::factory()->create()->id,
            'user_id' => User::factory()->create(['role' => 'buyer'])->id,
            'fisherman_id' => User::factory()->create(['role' => 'fisherman'])->id,
            'rider_id' => User::factory()->create(['role' => 'rider'])->id,
            'final_price' => 100.00,
            'escrow_balance' => 100.00,
            'logistics_type' => 'request_rider',
            'status' => 'en_route',
        ]);

        $response = $this->actingAs($unauthorizedSniper)->postJson("/dispatch/orders/{$orderId}/location", [
            'latitude' => 8.5800,
            'longitude' => 123.3300,
        ]);

        $response->assertStatus(403);
    }
}