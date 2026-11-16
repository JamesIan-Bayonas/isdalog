<?php // File: isdalog/tests/Feature/MarketplaceDiscoveryTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketplaceDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    private function listing(array $changes = []): Listing
    {
        return Listing::factory()->create(array_merge(['fish_name' => 'Bangus', 'location' => 'Galas Port',
            'status' => 'active', 'ends_at' => now()->addDay(), 'weight_kg' => 10, 'current_bid' => 1000], $changes));
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create(['role' => 'buyer']));
    }

    public function test_filters_search_the_full_database_and_pagination_retains_query(): void
    {
        for ($i = 0; $i < 15; $i++) {
            $this->listing();
        }
        $this->listing(['fish_name' => 'Tuna']);
        $this->get('/marketplace?q=bangus&port=Galas%20Port&sort=price_asc')->assertInertia(fn (Assert $p) => $p->component('Marketplace')
            ->has('activeListings', 12)->where('pagination.total', 15)->where('pagination.last_page', 2)
            ->where('pagination.next_url', fn ($url) => str_contains($url, 'q=bangus') && str_contains($url, 'page=2')));
        $this->get('/marketplace?q=bangus&port=Galas%20Port&sort=price_asc&page=2')->assertInertia(fn (Assert $p) => $p
            ->has('activeListings', 3)->where('pagination.from', 13)->where('pagination.to', 15)->where('filters.q', 'bangus'));
    }

    public function test_price_sort_and_ranges_compare_unit_price_not_batch_total(): void
    {
        $expensive = $this->listing(['weight_kg' => 1, 'current_bid' => 200]);
        $cheap = $this->listing(['weight_kg' => 10, 'current_bid' => 1000]);
        $this->get('/marketplace?sort=price_asc')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.id', $cheap->id)->where('activeListings.1.id', $expensive->id));
        $this->get('/marketplace?min_price=99&max_price=101&min_weight=5&max_weight=12')->assertInertia(fn (Assert $p) => $p
            ->has('activeListings', 1)->where('activeListings.0.id', $cheap->id)->where('activeListings.0.unit_price', 100));
    }

    public function test_invalid_ranges_and_unknown_sort_are_rejected(): void
    {
        foreach (['min_price=5&max_price=4', 'min_weight=10&max_weight=2', 'sort=sql', 'page=0', 'min_price=-1'] as $query) {
            $this->getJson('/marketplace?'.$query)->assertUnprocessable();
        }
    }

    public function test_literal_search_escapes_wildcards_and_matches_case_insensitively(): void
    {
        $match = $this->listing(['fish_name' => 'Bangus 100%_special']);
        $this->listing(['fish_name' => 'Bangus 10000special']);
        $this->get('/marketplace?q=100%25_special')->assertInertia(fn (Assert $p) => $p->has('activeListings', 1)->where('activeListings.0.id', $match->id));
    }

    public function test_inactive_withdrawn_and_expired_records_never_enter_results(): void
    {
        $this->listing(['ends_at' => now()->subSecond()]);
        $this->listing(['status' => 'completed']);
        $withdrawn = $this->listing();
        $withdrawn->withdrawn_at = now();
        $withdrawn->save();
        $this->get('/marketplace')->assertInertia(fn (Assert $p) => $p->has('activeListings', 0)->where('pagination.total', 0));
    }

    public function test_out_of_range_page_redirects_preserving_filters(): void
    {
        $this->listing();
        $this->get('/marketplace?q=Bangus&page=999')->assertRedirect(route('marketplace.index', ['q' => 'Bangus', 'page' => 1]));
    }

    public function test_missing_history_is_null_not_a_fabricated_average(): void
    {
        $this->listing();
        $this->get('/marketplace')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.benchmark.average_per_kg', null)->where('activeListings.0.benchmark.samples', 0));
    }

    public function test_legacy_sales_without_frozen_facts_do_not_create_a_benchmark(): void
    {
        $this->listing();
        foreach ([[5, 500, 'Galas Port'], [20, 3000, 'Galas Port'], [1, 900, 'Other Port']] as [$weight, $price, $port]) {
            $seller = User::factory()->create(['role' => 'fisherman']);
            $sold = $this->listing(['user_id' => $seller->id, 'status' => 'completed', 'location' => $port, 'weight_kg' => $weight]);
            DB::table('orders_logistics')->insert(['listing_id' => $sold->id, 'user_id' => auth()->id(), 'fisherman_id' => $seller->id,
                'final_price' => $price, 'escrow_balance' => 0, 'status' => 'completed', 'logistics_type' => 'self_pickup', 'created_at' => now(), 'updated_at' => now()]);
        }
        $this->get('/marketplace')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.benchmark.average_per_kg', null)->where('activeListings.0.benchmark.samples', 0));
    }

    public function test_price_change_requeries_filter_membership_and_total(): void
    {
        \Illuminate\Support\Facades\Event::fake([\App\Events\CatchBidUpdated::class]);
        $batch = $this->listing();
        $this->get('/marketplace?max_price=105')->assertInertia(fn (Assert $p) => $p->where('pagination.total', 1));
        $this->post(route('bids.store', $batch), ['bid_amount' => 1100])->assertSessionHasNoErrors();
        $this->get('/marketplace?max_price=105')->assertInertia(fn (Assert $p) => $p->has('activeListings', 0)->where('pagination.total', 0));
    }

    public function test_closing_sort_places_null_deadlines_last_and_weight_sort_uses_batch_weight(): void
    {
        $legacy = $this->listing(['ends_at' => null, 'weight_kg' => 1]);
        $soon = $this->listing(['ends_at' => now()->addMinute(), 'weight_kg' => 20]);
        $this->get('/marketplace?sort=closing')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.id', $soon->id)->where('activeListings.1.id', $legacy->id));
        $this->get('/marketplace?sort=weight_asc')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.id', $legacy->id));
    }
}
