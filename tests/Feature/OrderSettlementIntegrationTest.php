<?php

namespace Tests\Feature;

use App\Events\CargoStatusUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class OrderSettlementIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_confirming_delivery_distributes_funds_to_fisherman_and_rider(): void
    {
        Event::fake([CargoStatusUpdated::class]);
        Queue::fake();

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role'           => 'fisherman',
            'wallet_balance' => 0.00,
            'contact_number' => '09171112222',
        ]);

        /** @var User $rider */
        $rider = User::factory()->create([
            'role'           => 'rider',
            'status'         => 'verified',
            'wallet_balance' => 0.00,
            'contact_number' => '09183334444',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role'           => 'buyer',
            'wallet_balance' => 0.00,
        ]);

        $listing = Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Tuna Batch',
            'weight_kg'      => 10.00,
            'starting_price' => 1000.00,
            'current_bid'    => 1000.00,
            'location'       => 'Galas Port',
            'status'         => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id'     => $listing->id,
            'user_id'        => $buyer->id,
            'fisherman_id'   => $fisherman->id,
            'rider_id'       => $rider->id,
            'final_price'    => 1000.00,
            'delivery_fee'   => 150.00,
            'escrow_balance' => 1150.00,
            'logistics_type' => 'request_rider',
            'status'         => 'delivered',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $response = $this->actingAs($buyer)->post("/orders/{$orderId}/confirm", [
            'fisherman_rating'  => 5,
            'fisherman_comment' => 'Fresh catch!',
            'rider_rating'      => 5,
            'rider_comment'     => 'Fast transit.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        // 97% of ₱1000 = ₱970
        $this->assertEquals(970.00, (float) $fisherman->fresh()->wallet_balance);
        // 100% of ₱150 delivery fee = ₱150
        $this->assertEquals(150.00, (float) $rider->fresh()->wallet_balance);

        $this->assertDatabaseHas('orders_logistics', [
            'id'             => $orderId,
            'status'         => 'completed',
            'escrow_balance' => 0.00,
            'rating'         => 5,
        ]);

        $this->assertDatabaseHas('order_reviews', [
            'order_id'    => $orderId,
            'target_type' => 'fisherman',
            'rating'      => 5,
        ]);

        $this->assertDatabaseHas('order_reviews', [
            'order_id'    => $orderId,
            'target_type' => 'rider',
            'rating'      => 5,
        ]);

        Event::assertDispatched(CargoStatusUpdated::class);
        Queue::assertPushed(SendSmsNotification::class, 2);
    }
}