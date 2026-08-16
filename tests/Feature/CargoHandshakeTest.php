<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CargoHandshakeTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_creation_generates_cryptographic_handshake_otps(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 5000.00,
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Maya-Maya Crate',
            'weight_kg' => 20.00,
            'starting_price' => 2000.00,
            'current_bid' => 2000.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/order", [
            'logistics_type' => 'request_rider',
        ]);

        $response->assertRedirect(route('dashboard'));

        $order = DB::table('orders_logistics')->where('listing_id', $listing->id)->first();
        $this->assertNotNull($order->pickup_otp);
        $this->assertNotNull($order->delivery_otp);
        $this->assertEquals(6, strlen($order->pickup_otp));
        $this->assertEquals(6, strlen($order->delivery_otp));
    }

    public function test_rider_can_claim_cargo_with_valid_pickup_otp(): void
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

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'rider_id' => $rider->id,
            'status' => 'en_route',
        ]);
    }

    public function test_rider_claim_rejected_with_invalid_pickup_otp(): void
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
            'rider_id' => null,
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
            'pickup_otp' => '888888',
            'delivery_otp' => '999999',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '000000',
        ]);

        $response->assertSessionHasErrors('pickup_otp');
        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'rider_id' => null,
            'status' => 'pending_dispatch',
        ]);
    }

    public function test_rider_can_deliver_cargo_with_valid_buyer_delivery_otp(): void
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
            'fish_name' => 'Tambakol',
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
            'rider_id' => $rider->id,
            'final_price' => 1500.00,
            'escrow_balance' => 1500.00,
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

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'status' => 'delivered',
        ]);
    }
}