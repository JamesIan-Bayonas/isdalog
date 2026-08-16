<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SmsCellularHandshakeTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_creation_triggers_cellular_sms_to_harvester_and_buyer(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'contact_number' => '09171234567',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'contact_number' => '09187654321',
            'wallet_balance' => 5000.00,
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Maya-Maya Batch',
            'weight_kg' => 25.00,
            'starting_price' => 2500.00,
            'current_bid' => 2500.00,
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

    public function test_rider_claiming_cargo_dispatches_sms_to_buyer(): void
    {
        /** @var User $rider */
        $rider = User::factory()->create([
            'name' => 'Speedy Courier',
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'contact_number' => '09191112222',
        ]);

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
            'pickup_otp' => '555555',
            'delivery_otp' => '666666',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '555555',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'rider_id' => $rider->id,
            'status' => 'en_route',
        ]);
    }
}   