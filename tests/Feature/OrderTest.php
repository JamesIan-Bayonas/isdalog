<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_can_create_order_and_lock_escrow(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 0.00,
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 5000.00,
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol Batch',
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
        $response->assertSessionHasNoErrors();

        $this->assertEquals(3000.00, (float) $buyer->fresh()->wallet_balance);
        $this->assertEquals('completed', $listing->fresh()->status);

        $this->assertDatabaseHas('orders_logistics', [
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'final_price' => 2000.00,
            'escrow_balance' => 2000.00,
            'status' => 'pending_dispatch',
        ]);
    }

    public function test_buyer_can_confirm_delivery_and_release_escrow_to_fisherman(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 0.00,
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 0.00,
        ]);

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
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
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

        // 97% net payout after 3% governance fee (₱1000 - ₱30 = ₱970)
        $this->assertEquals(970.00, (float) $fisherman->fresh()->wallet_balance);

        $this->assertDatabaseHas('orders_logistics', [
            'id' => $orderId,
            'status' => 'completed',
            'escrow_balance' => 0.00,
            'rating' => 5,
        ]);
    }

    public function test_buyer_cannot_confirm_order_belonging_to_another_user(): void
    {
        /** @var User $owner */
        $owner = User::factory()->create(['role' => 'buyer']);

        /** @var User $unauthorizedBuyer */
        $unauthorizedBuyer = User::factory()->create(['role' => 'buyer']);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Maya-Maya',
            'weight_kg' => 5.00,
            'starting_price' => 500.00,
            'current_bid' => 500.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $owner->id,
            'fisherman_id' => $fisherman->id,
            'final_price' => 500.00,
            'escrow_balance' => 500.00,
            'logistics_type' => 'self_pickup',
            'status' => 'delivered',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($unauthorizedBuyer)->post("/orders/{$orderId}/confirm", [
            'rating' => 5,
        ]);

        $response->assertSessionHasErrors('error');
        $this->assertEquals(0.00, (float) $fisherman->fresh()->wallet_balance);
    }
}