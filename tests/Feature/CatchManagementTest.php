<?php

namespace Tests\Feature;

use App\Events\ListingAvailabilityUpdated;
use App\Models\Listing;
use App\Models\ListingActivity;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatchManagementTest extends TestCase
{
    use RefreshDatabase;

    private function listing(): array
    {
        Event::fake([ListingAvailabilityUpdated::class]);
        $owner = User::factory()->create(['role' => 'fisherman']);
        $listing = Listing::create(['user_id' => $owner->id, 'fish_name' => 'Catch', 'weight_kg' => 5,
            'starting_price' => 300, 'current_bid' => 300, 'location' => 'Port', 'status' => 'active']);
        $this->actingAs($owner);
        return [$owner, $listing];
    }

    private function payload(array $overrides = []): array
    {
        return array_merge(['fish_name' => 'Updated catch', 'weight_kg' => '6.00', 'starting_price' => '400.00',
            'location' => 'New Port', 'management_version' => 0], $overrides);
    }

    public function test_owner_can_edit_available_listing_and_keep_before_after_audit(): void
    {
        [$owner, $listing] = $this->listing();
        $this->patch("/listings/{$listing->id}/details", $this->payload())->assertSessionHasNoErrors();
        $this->assertEquals(400, $listing->fresh()->current_bid);
        $this->assertEquals(1, $listing->fresh()->management_version);
        $audit = ListingActivity::firstOrFail();
        $this->assertEquals('300.00', $audit->before_values['starting_price']);
        $this->assertEquals('400.00', $audit->after_values['starting_price']);
        $this->assertEquals($owner->id, $audit->actor_id);
        $this->get('/my-catches')->assertInertia(fn (Assert $page) => $page->component('Catches/Manage')
            ->has('listings.data', 1)->where('listings.data.0.bids_count', 0)->where('listings.data.0.orders_exists', false)
            ->has('listings.data.0.activities', 1));
    }

    public function test_withdrawal_hides_listing_and_blocks_stale_bids_and_purchase(): void
    {
        [$owner, $listing] = $this->listing();
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => 'Catch no longer available.'])->assertSessionHasNoErrors();
        $this->assertNotNull($listing->fresh()->withdrawn_at);
        $this->get('/marketplace')->assertInertia(fn (Assert $page) => $page->has('activeListings', 0));
        $this->get('/api/listings')->assertJsonCount(0, 'data');
        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page->has('activeListings', 0));
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 1, 'reason' => 'Again'])->assertSessionHasErrors('listing');
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", ['bid_amount' => 500])->assertSessionHasErrors('bid_amount');
        $this->post("/listings/{$listing->id}/order", ['logistics_type' => 'self_pickup'])->assertSessionHasErrors('error');
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('bids', 0);
        $this->assertDatabaseCount('orders_logistics', 0);
        $this->assertDatabaseCount('listing_activities', 1);
    }

    public function test_bid_placed_after_form_open_prevents_edit_and_withdrawal(): void
    {
        [, $listing] = $this->listing();
        $buyer = User::factory()->create(['role' => 'buyer']);
        $listing->bids()->create(['buyer_id' => $buyer->id, 'amount' => 400]);
        $this->patch("/listings/{$listing->id}/details", $this->payload())->assertSessionHasErrors('listing');
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => 'Unavailable'])->assertSessionHasErrors('listing');
        $this->assertEquals('Catch', $listing->fresh()->fish_name);
        $this->assertDatabaseCount('listing_activities', 0);
    }

    public function test_existing_order_prevents_changes_even_if_listing_status_is_active(): void
    {
        [$owner, $listing] = $this->listing();
        $buyer = User::factory()->create(['role' => 'buyer']);
        DB::table('orders_logistics')->insert(['listing_id' => $listing->id, 'fisherman_id' => $owner->id,
            'user_id' => $buyer->id, 'final_price' => 300, 'escrow_balance' => 300,
            'logistics_type' => 'self_pickup', 'status' => 'pending_dispatch', 'created_at' => now(), 'updated_at' => now()]);
        $this->patch("/listings/{$listing->id}/details", $this->payload())->assertSessionHasErrors('listing');
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => 'Unavailable'])->assertSessionHasErrors('listing');
        $this->get('/my-catches')->assertInertia(fn (Assert $page) => $page->where('listings.data.0.orders_exists', true));
    }

    public function test_stale_version_cannot_overwrite_newer_listing_or_withdraw_it(): void
    {
        [, $listing] = $this->listing();
        $this->patch("/listings/{$listing->id}/details", $this->payload())->assertSessionHasNoErrors();
        $this->patch("/listings/{$listing->id}/details", $this->payload(['fish_name' => 'Stale name']))->assertSessionHasErrors('listing');
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => 'Stale form'])->assertSessionHasErrors('listing');
        $this->assertEquals('Updated catch', $listing->fresh()->fish_name);
        $this->assertDatabaseCount('listing_activities', 1);
    }

    public function test_owner_and_role_boundaries(): void
    {
        [, $listing] = $this->listing();
        foreach (['fisherman', 'buyer', 'rider', 'admin'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->patch("/listings/{$listing->id}/details", $this->payload())->assertForbidden();
            $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => 'Not mine'])->assertForbidden();
            if ($role !== 'fisherman') $this->get('/my-catches')->assertForbidden();
            else $this->get('/my-catches')->assertInertia(fn (Assert $page) => $page->has('listings.data', 0));
        }
    }

    public function test_noop_does_not_create_history_and_validation_rejects_invalid_values(): void
    {
        [, $listing] = $this->listing();
        $this->patch("/listings/{$listing->id}/details", $this->payload(['fish_name' => 'Catch', 'weight_kg' => '5.00', 'starting_price' => '300.00', 'location' => 'Port']))->assertSessionHasNoErrors();
        $this->assertDatabaseCount('listing_activities', 0);
        $this->patch("/listings/{$listing->id}/details", $this->payload(['weight_kg' => -1, 'starting_price' => '300.001']))->assertSessionHasErrors(['weight_kg', 'starting_price']);
        $this->post("/listings/{$listing->id}/withdraw", ['management_version' => 0, 'reason' => ' '])->assertSessionHasErrors('reason');
    }

    public function test_audit_failure_rolls_back_listing_changes(): void
    {
        [, $listing] = $this->listing();
        Event::listen('eloquent.creating: '.ListingActivity::class, fn () => throw new \RuntimeException('Audit unavailable'));
        try {
            $this->withoutExceptionHandling()->patch("/listings/{$listing->id}/details", $this->payload());
            $this->fail('Expected audit failure');
        } catch (\RuntimeException $exception) {
            $this->assertEquals('Audit unavailable', $exception->getMessage());
        } finally {
            Event::forget('eloquent.creating: '.ListingActivity::class);
        }
        $this->assertEquals('Catch', $listing->fresh()->fish_name);
        $this->assertEquals(0, $listing->fresh()->management_version);
        $this->assertDatabaseCount('listing_activities', 0);
    }

    public function test_deposit_boundary_matches_the_existing_fifty_peso_form_minimum(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 0]);
        $this->actingAs($buyer)->post('/wallet/deposit', ['amount' => 49.99])->assertSessionHasErrors('amount');
        $this->post('/wallet/deposit', ['amount' => 50])->assertSessionHasNoErrors();
        $this->assertEquals(50, $buyer->fresh()->wallet_balance);
    }
}
