<?php

namespace Tests\Feature;

use App\Events\CatchBidUpdated;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class BiddingWatchlistTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_dashboard_displays_winning_bid_status(): void
    {
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
            'status' => 'active',
        ]);

        $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 3500.00,
        ]);

        $response = $this->actingAs($buyer)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('biddingWatchlist', 1)
            ->where('biddingWatchlist.0.bid_status', 'WINNING')
            ->where('biddingWatchlist.0.my_highest_bid', 3500)
            ->where('biddingWatchlist.0.current_bid', 3500)
        );
    }

    public function test_buyer_dashboard_displays_outbid_status_when_competing_buyer_places_higher_bid(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer1 */
        $buyer1 = User::factory()->create(['role' => 'buyer']);

        /** @var User $buyer2 */
        $buyer2 = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu',
            'weight_kg' => 15.00,
            'starting_price' => 1500.00,
            'current_bid' => 1500.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        // Buyer 1 bids 1800
        $this->actingAs($buyer1)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 1800.00,
        ]);

        // Buyer 2 outbids with 2200
        $this->actingAs($buyer2)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 2200.00,
        ]);

        // Buyer 1 inspects dashboard
        $response = $this->actingAs($buyer1)->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->has('biddingWatchlist', 1)
            ->where('biddingWatchlist.0.bid_status', 'OUTBID')
            ->where('biddingWatchlist.0.my_highest_bid', 1800)
            ->where('biddingWatchlist.0.current_bid', 2200)
        );
    }

    public function test_bid_submission_dispatches_websocket_broadcast_event(): void
    {
        Event::fake([CatchBidUpdated::class]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol',
            'weight_kg' => 10.00,
            'starting_price' => 1000.00,
            'current_bid' => 1000.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 1200.00,
        ]);

        $response->assertRedirect();
        Event::assertDispatched(CatchBidUpdated::class, function ($event) use ($listing) {
            return (int) $event->listing->id === (int) $listing->id
                && (float) $event->listing->current_bid === 1200.00;
        });
    }

    public function test_bid_less_than_or_equal_to_current_bid_is_rejected(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Bangus',
            'weight_kg' => 20.00,
            'starting_price' => 2000.00,
            'current_bid' => 2000.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 2000.00,
        ]);

        $response->assertSessionHasErrors('bid_amount');
        $this->assertEquals(2000.00, (float) $listing->fresh()->current_bid);
    }
}