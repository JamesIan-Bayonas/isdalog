<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\OrderReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MarketplaceRiderRatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_marketplace_provides_rider_metadata_and_persists_dual_reviews(): void
    {
        /** @var \App\Models\User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer', 'status' => 'verified', 'wallet_balance' => 5000]);
        /** @var \App\Models\User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman', 'status' => 'verified']);
        /** @var \App\Models\User $rider */
        $rider = User::factory()->create(['role' => 'rider', 'status' => 'verified']);
        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Bangus',
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
            'delivery_fee' => 150.00,
            'logistics_type' => 'request_rider',
            'status' => 'delivered',
            'pickup_otp' => '123456',
            'delivery_otp' => '654321',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        // 1. Verify Marketplace Controller passes rider_id and delivery_fee
        $response = $this->actingAs($buyer)->get(route('marketplace.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Marketplace')
            ->has('activeOrders.0', fn ($order) => $order
                ->where('order_id', $orderId)
                ->where('rider_id', $rider->id)
                ->where('delivery_fee', 150)
                ->etc()
            )
        );
        // 2. Submit Dual Rating Payload via Order Confirmation
        $confirmResponse = $this->actingAs($buyer)->post(route('orders.confirm', $orderId), [
            'fisherman_rating' => 5,
            'fisherman_comment' => 'Very fresh fish.',
            'rider_rating' => 4,
            'rider_comment' => 'Fast delivery.',
            'rating' => 5,
        ]);
        $confirmResponse->assertSessionHasNoErrors();
        // 3. Assert both reviews exist in database
        $this->assertDatabaseHas('order_reviews', [
            'order_id' => $orderId,
            'reviewer_id' => $buyer->id,
            'reviewee_id' => $fisherman->id,
            'target_type' => 'fisherman',
            'rating' => 5,
        ]);
        $this->assertDatabaseHas('order_reviews', [
            'order_id' => $orderId,
            'reviewer_id' => $buyer->id,
            'reviewee_id' => $rider->id,
            'target_type' => 'rider',
            'rating' => 4,
        ]);
    }
}