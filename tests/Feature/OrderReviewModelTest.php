<?php

namespace Tests\Feature;

use App\Models\OrderReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderReviewModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_review_supports_mass_assignment(): void
    {
        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        // Insert prerequisite listing and order records
        $listingId = DB::table('listings')->insertGetId([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Lapu-Lapu',
            'weight_kg'      => 10.00,
            'starting_price' => 1000.00,
            'current_bid'    => 1000.00,
            'location'       => 'Galas Port',
            'status'         => 'completed',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id'     => $listingId,
            'user_id'        => $buyer->id,
            'fisherman_id'   => $fisherman->id,
            'final_price'    => 1000.00,
            'escrow_balance' => 0.00,
            'logistics_type' => 'self_pickup',
            'status'         => 'completed',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $review = OrderReview::create([
            'order_id'    => $orderId,
            'reviewer_id' => $buyer->id,
            'reviewee_id' => $fisherman->id,
            'target_type' => 'fisherman',
            'rating'      => 5,
            'comment'     => 'Exceptional catch quality and freshness.',
        ]);

        $this->assertInstanceOf(OrderReview::class, $review);
        $this->assertDatabaseHas('order_reviews', [
            'id'          => $review->id,
            'order_id'    => $orderId,
            'reviewer_id' => $buyer->id,
            'reviewee_id' => $fisherman->id,
            'target_type' => 'fisherman',
            'rating'      => 5,
            'comment'     => 'Exceptional catch quality and freshness.',
        ]);
    }
}