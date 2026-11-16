<?php // File: isdalog/tests/Feature/AtomicSaleTest.php

namespace Tests\Feature;

use App\Models\Bid;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AtomicSaleTest extends TestCase
{
    use RefreshDatabase;

    private function batch(User $owner, int $price = 600): Listing
    {
        return Listing::factory()->create(['user_id' => $owner->id, 'status' => 'active',
            'starting_price' => $price, 'current_bid' => $price, 'ends_at' => now()->addHour()]);
    }

    private function bid(Listing $listing, User $buyer, int $amount = 600): void
    {
        Bid::create(['listing_id' => $listing->id, 'buyer_id' => $buyer->id, 'amount' => $amount]);
    }

    public function test_repeated_acceptance_creates_one_sale_and_debits_once(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = $this->batch($owner);
        $this->bid($batch, $buyer);
        $this->actingAs($owner)->post(route('listings.accept-bid', $batch))->assertSessionHasNoErrors();
        $this->post(route('listings.accept-bid', $batch))->assertSessionHasErrors('error');
        $this->assertDatabaseCount('orders_logistics', 1);
        $this->assertEquals(400, $buyer->fresh()->wallet_balance);
    }

    public function test_shared_buyer_cannot_fund_two_sales_beyond_current_balance(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $first = $this->batch($owner);
        $second = $this->batch($owner);
        $this->bid($first, $buyer);
        $this->bid($second, $buyer);
        $this->actingAs($owner)->post(route('listings.accept-bid', $first))->assertSessionHasNoErrors();
        $this->post(route('listings.accept-bid', $second))->assertSessionHasErrors('error');
        $this->assertEquals('active', $second->fresh()->status);
        $this->assertEquals(400, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('orders_logistics', 1);
    }

    public function test_acceptance_selects_actual_highest_bid_and_enforces_owner(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $low = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $high = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = $this->batch($owner);
        $this->bid($batch, $low, 600);
        $this->bid($batch, $high, 700);
        $this->actingAs($low)->post(route('listings.accept-bid', $batch))->assertForbidden();
        $this->actingAs($owner)->post(route('listings.accept-bid', $batch))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('orders_logistics', ['user_id' => $high->id, 'final_price' => 700, 'escrow_balance' => 700]);
        $this->assertEquals(1000, $low->fresh()->wallet_balance);
        $this->assertEquals(300, $high->fresh()->wallet_balance);
    }

    public function test_expired_sales_and_no_bid_awards_do_not_spend(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = $this->batch($owner);
        $this->actingAs($owner)->post(route('listings.accept-bid', $batch))->assertSessionHasErrors('error');
        $this->bid($batch, $buyer);
        $batch->update(['ends_at' => now()->subSecond()]);
        $this->post(route('listings.accept-bid', $batch))->assertSessionHasErrors('error');
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertSessionHasErrors('error');
        $this->assertDatabaseCount('orders_logistics', 0);
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
    }

    public function test_existing_order_blocks_a_sale_even_if_listing_is_incorrectly_active(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 2000]);
        $batch = $this->batch($owner);
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $batch->update(['status' => 'active']);
        $this->post(route('orders.store', $batch), ['logistics_type' => 'request_rider'])->assertSessionHasErrors('error');
        $this->bid($batch, $buyer);
        $this->actingAs($owner)->post(route('listings.accept-bid', $batch))->assertSessionHasErrors('error');
        $this->assertDatabaseCount('orders_logistics', 1);
        $this->assertEquals(1400, $buyer->fresh()->wallet_balance);
    }

    public function test_order_insert_failure_rolls_back_balance_and_listing(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = $this->batch($owner);
        $this->bid($batch, $buyer);
        DB::statement("CREATE TRIGGER reject_sale BEFORE INSERT ON orders_logistics BEGIN SELECT RAISE(ABORT, 'Synthetic order failure'); END");
        $this->actingAs($owner)->post(route('listings.accept-bid', $batch))->assertStatus(500);
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->assertEquals('active', $batch->fresh()->status);
        $this->assertDatabaseCount('orders_logistics', 0);
    }

    public function test_database_constraint_rejects_a_second_order_for_one_listing(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 2000]);
        $batch = $this->batch($owner);
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $order = (array) DB::table('orders_logistics')->first();
        unset($order['id']);
        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        DB::table('orders_logistics')->insert($order);
    }

    public function test_stale_bound_listing_cannot_reopen_a_completed_sale(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $stale = $this->batch($owner);
        $this->bid($stale, $buyer);
        Listing::whereKey($stale->id)->update(['status' => 'completed']);
        $this->actingAs($owner);
        $request = \Illuminate\Http\Request::create('/accept', 'POST');
        $request->setUserResolver(fn () => $owner);
        $response = app(\App\Http\Controllers\ListingController::class)->acceptBid($request, $stale);
        $this->assertTrue($response->getSession()->get('errors')->has('error'));
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('orders_logistics', 0);
    }

    public function test_migration_refuses_historical_duplicates_without_deleting_them(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 2000]);
        $batch = $this->batch($owner);
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $migration = require database_path('migrations/2026_11_03_110000_enforce_one_order_per_listing.php');
        $migration->down();
        $order = (array) DB::table('orders_logistics')->first();
        unset($order['id']);
        $duplicateId = DB::table('orders_logistics')->insertGetId($order);
        try {
            $migration->up();
            $this->fail('Migration should refuse unreconciled duplicates.');
        } catch (\RuntimeException $exception) {
            $this->assertStringContainsString('Duplicate listing orders exist', $exception->getMessage());
            $this->assertDatabaseCount('orders_logistics', 2);
        } finally {
            DB::table('orders_logistics')->where('id', $duplicateId)->delete();
            $migration->up();
        }
    }

    public function test_direct_purchase_spending_is_seen_by_subsequent_award(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $direct = $this->batch($owner);
        $auction = $this->batch($owner);
        $this->bid($auction, $buyer);
        $this->actingAs($buyer)->post(route('orders.store', $direct), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $this->actingAs($owner)->post(route('listings.accept-bid', $auction))->assertSessionHasErrors('error');
        $this->assertEquals(400, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('orders_logistics', 1);
    }
}
