<?php

namespace Tests\Feature;

use App\Events\CargoStatusUpdated;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class CargoTelemetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_courier_claiming_cargo_dispatches_cargo_status_updated_event(): void
    {
        Event::fake([CargoStatusUpdated::class]);

        /** @var User $rider */
        $rider = User::factory()->create([
            'name' => 'Galas Courier',
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Yellowfin Tuna Batch',
            'weight_kg' => 30.00,
            'starting_price' => 3000.00,
            'current_bid' => 3000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 3000.00,
            'escrow_balance' => 3000.00,
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

        Event::assertDispatched(CargoStatusUpdated::class, function ($event) use ($orderId, $rider) {
            return $event->orderId === $orderId 
                && $event->status === 'en_route' 
                && $event->riderName === $rider->name;
        });
    }

    public function test_courier_delivering_cargo_dispatches_cargo_status_updated_event(): void
    {
        Event::fake([CargoStatusUpdated::class]);

        /** @var User $rider */
        $rider = User::factory()->create([
            'name' => 'Express Rider',
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu Batch',
            'weight_kg' => 10.00,
            'starting_price' => 1000.00,
            'current_bid' => 1000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => $rider->id,
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
            'pickup_otp' => '111111',
            'delivery_otp' => '222222',
            'logistics_type' => 'request_rider',
            'status' => 'en_route',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/deliver", [
            'delivery_otp' => '222222',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        Event::assertDispatched(CargoStatusUpdated::class, function ($event) use ($orderId, $rider) {
            return $event->orderId === $orderId 
                && $event->status === 'delivered' 
                && $event->riderName === $rider->name;
        });
    }

    public function test_buyer_confirming_order_dispatches_cargo_status_updated_completed_event(): void
    {
        Event::fake([CargoStatusUpdated::class]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol Batch',
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
            'rider_id' => null,
            'final_price' => 1500.00,
            'escrow_balance' => 1500.00,
            'logistics_type' => 'request_rider',
            'status' => 'delivered',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->post("/orders/{$orderId}/confirm", [
            'rating' => 5,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        Event::assertDispatched(CargoStatusUpdated::class, function ($event) use ($orderId) {
            return $event->orderId === $orderId && $event->status === 'completed';
        });
    }
}