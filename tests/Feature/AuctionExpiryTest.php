<?php // File: isdalog/tests/Feature/AuctionExpiryTest.php

namespace Tests\Feature;

use App\Events\ListingAvailabilityUpdated;
use App\Models\Listing;
use App\Models\User;
use App\Services\AuctionExpiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuctionExpiryTest extends TestCase
{
    use RefreshDatabase;

    private function batch(): array
    {
        $this->travelTo(now()->startOfSecond());
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $listing = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'active', 'current_bid' => 100,
            'starting_price' => 100, 'ends_at' => now()->addMinute()]);
        $this->actingAs($buyer);

        return [$listing, $seller, $buyer];
    }

    public function test_exact_deadline_rejects_bids_even_without_scheduled_cleanup(): void
    {
        [$listing] = $this->batch();
        $this->travelTo($listing->ends_at);
        $this->post(route('bids.store', $listing), ['bid_amount' => 101])->assertSessionHasErrors('bid_amount');
        $this->assertNull($listing->fresh()->expired_at);
        $this->assertDatabaseCount('bids', 0);
    }

    public function test_before_deadline_accepts_one_cent_and_rejects_ties_or_fractional_cents(): void
    {
        [$listing] = $this->batch();
        $this->travelTo($listing->ends_at->copy()->subSecond());
        $this->post(route('bids.store', $listing), ['bid_amount' => '100.01'])->assertSessionHasNoErrors();
        foreach (['100.01', '100', '100.011', '100000000', '-1'] as $amount) {
            $this->post(route('bids.store', $listing), ['bid_amount' => $amount])->assertSessionHasErrors('bid_amount');
        }
        $this->assertDatabaseCount('bids', 1);
    }

    public function test_expiry_is_idempotent_audited_and_never_awards_or_charges(): void
    {
        [$listing, $seller, $buyer] = $this->batch();
        $this->post(route('bids.store', $listing), ['bid_amount' => 101])->assertSessionHasNoErrors();
        Event::fake([ListingAvailabilityUpdated::class]);
        $this->travelTo($listing->ends_at->copy()->addMinutes(5));
        $this->assertSame(1, app(AuctionExpiry::class)->run());
        $this->assertSame(0, app(AuctionExpiry::class)->run());
        $this->assertTrue($listing->fresh()->expired_at->equalTo($listing->ends_at));
        $this->assertDatabaseHas('listing_activities', ['listing_id' => $listing->id, 'action' => 'expired', 'actor_id' => null]);
        $this->assertDatabaseCount('listing_activities', 1);
        $this->assertDatabaseCount('orders_logistics', 0);
        $this->assertDatabaseCount('wallet_transactions', 0);
        Event::assertDispatched(ListingAvailabilityUpdated::class, fn ($event) => $event->listing['expired'] === true && $event->listing['available'] === false);
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->actingAs($seller)->post(route('listings.accept-bid', $listing))->assertSessionHasErrors('error');
    }

    public function test_discovery_and_active_counts_exclude_deadlines_before_cleanup(): void
    {
        [$listing, $seller] = $this->batch();
        $this->travelTo($listing->ends_at);
        $this->get('/api/listings')->assertJsonCount(0, 'data');
        $this->get('/marketplace')->assertInertia(fn (Assert $page) => $page->component('Marketplace')->has('activeListings', 0));
        $this->actingAs($seller)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->component('Dashboard')->has('activeListings', 0));
    }

    public function test_null_deadline_legacy_listing_remains_open(): void
    {
        [$listing] = $this->batch();
        $listing->update(['ends_at' => null]);
        $this->travel(3)->days();
        $this->assertSame(0, app(AuctionExpiry::class)->run());
        $this->post(route('bids.store', $listing), ['bid_amount' => 101])->assertSessionHasNoErrors();
    }

    public function test_expired_listing_cannot_be_edited_to_reopen_it(): void
    {
        [$listing, $seller] = $this->batch();
        $this->travelTo($listing->ends_at);
        $this->actingAs($seller)->post(route('catches.withdraw', $listing), ['management_version' => 0, 'reason' => 'Withdraw'])->assertSessionHasErrors('listing');
    }

    public function test_buyer_watchlist_labels_expired_offer_and_does_not_count_it_active(): void
    {
        [$listing] = $this->batch();
        $this->post(route('bids.store', $listing), ['bid_amount' => 101])->assertSessionHasNoErrors();
        $this->travelTo($listing->ends_at);
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->component('Dashboard')
            ->where('biddingWatchlist.0.listing_status', 'expired')->where('biddingWatchlist.0.bid_status', 'EXPIRED')->where('metrics.activeBids', 0));
    }

    public function test_new_web_listing_has_the_existing_48_hour_deadline(): void
    {
        [, $seller] = $this->batch();
        $this->actingAs($seller)->post('/listings', ['fish_name' => 'Bangus', 'weight_kg' => 5, 'starting_price' => 100, 'location' => 'Port'])->assertSessionHasNoErrors();
        $this->assertTrue(Listing::latest('id')->first()->ends_at->equalTo(now()->addDays(2)));
    }

    public function test_scheduled_command_skips_sold_withdrawn_and_future_batches(): void
    {
        [$future, $seller] = $this->batch();
        $sold = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'completed', 'ends_at' => now()->subMinute()]);
        $withdrawn = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'active', 'ends_at' => now()->subMinute()]);
        $withdrawn->withdrawn_at = now();
        $withdrawn->save();
        $this->artisan('auctions:expire')->expectsOutput('Expired 0 auction(s). No funds moved.')->assertSuccessful();
        foreach ([$future, $sold, $withdrawn] as $listing) {
            $this->assertNull($listing->fresh()->expired_at);
        }
    }

    public function test_failed_expiry_audit_rolls_back_marker(): void
    {
        [$listing] = $this->batch();
        $this->travelTo($listing->ends_at);
        \Illuminate\Support\Facades\DB::statement("CREATE TRIGGER reject_expiry BEFORE INSERT ON listing_activities BEGIN SELECT RAISE(ABORT, 'Synthetic expiry failure'); END");
        try {
            app(AuctionExpiry::class)->run();
            $this->fail('Audit failure must prevent a partial expiry update.');
        } catch (\Illuminate\Database\QueryException $exception) {
            $this->assertNull($listing->fresh()->expired_at);
            $this->assertEquals(0, $listing->fresh()->management_version);
        }
    }

    public function test_bid_rechecks_current_price_instead_of_stale_bound_model(): void
    {
        [$stale] = $this->batch();
        Listing::whereKey($stale->id)->update(['current_bid' => 200]);
        $request = \Illuminate\Http\Request::create('/bid', 'POST', ['bid_amount' => 150]);
        $request->setUserResolver(fn () => auth()->user());
        try {
            app(\App\Http\Controllers\BidController::class)->store($request, $stale);
            $this->fail('A competing higher offer must reject the stale bid.');
        } catch (\Illuminate\Validation\ValidationException $exception) {
            $this->assertArrayHasKey('bid_amount', $exception->errors());
            $this->assertDatabaseCount('bids', 0);
        }
    }
}
