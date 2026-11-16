<?php // File: isdalog/tests/Feature/MarketEvidenceTest.php

namespace Tests\Feature;

use App\Models\Bid;
use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use App\Services\MarketBenchmarks;
use App\Services\SaleFacts;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketEvidenceTest extends TestCase
{
    use RefreshDatabase;

    private function batch(array $values = []): Listing
    {
        return Listing::factory()->create(array_merge(['fish_name' => 'Bangus', 'location' => 'Galas Port', 'weight_kg' => 10, 'current_bid' => 1000, 'status' => 'active', 'ends_at' => now()->addDay()], $values));
    }

    private function completed(int $weight, int $price, array $changes = [], bool $settled = true): object
    {
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer']);
        $listing = $this->batch(['user_id' => $seller->id, 'weight_kg' => $weight, 'status' => 'completed']);
        $id = DB::table('orders_logistics')->insertGetId(array_merge(SaleFacts::capture($listing), ['listing_id' => $listing->id, 'user_id' => $buyer->id, 'fisherman_id' => $seller->id, 'final_price' => $price, 'escrow_balance' => 0, 'delivery_fee' => 0, 'status' => 'completed', 'logistics_type' => 'self_pickup', 'sale_snapshot_at' => now()->subDays(5), 'completed_at' => now()->subDay(), 'created_at' => now()->subDays(5), 'updated_at' => now()], $changes));
        $fee = (int) ($changes['delivery_fee'] ?? 0);
        if ($fee > 0) {
            $rider=User::factory()->create(['role'=>'rider','status'=>'verified']);
            DB::table('orders_logistics')->where('id',$id)->update(['rider_id'=>$rider->id,'logistics_type'=>'request_rider']);
        }
        if ($settled) {
            DB::table('order_settlements')->insert(['order_id' => $id, 'funded_amount' => $price+$fee, 'fisherman_amount' => $price * .97, 'platform_fee' => $price * .03, 'rider_amount' => $fee, 'created_at' => now()->subDay(), 'updated_at' => now()->subDay()]);
        }

        return DB::table('orders_logistics')->where('id', $id)->first();
    }

    public function test_unit_price_reference_uses_frozen_weights_canonical_identity_and_completion_dates(): void
    {
        $this->travelTo(now()->startOfDay());
        $one = $this->completed(5, 500);
        $this->completed(20, 4000);
        $this->completed(1, 300, ['delivery_fee' => 900]);
        DB::table('listings')->where('id', $one->listing_id)->update(['weight_kg' => 999, 'fish_name' => 'Changed later', 'location' => 'Changed later']);
        $listing = $this->batch(['fish_name' => 'Milkfish']);
        $benchmark = MarketBenchmarks::forListings([$listing])[$listing->id];
        $this->assertSame('available', $benchmark['status']);
        $this->assertSame(3, $benchmark['samples']);
        $this->assertSame(200.0, $benchmark['average_per_kg']);
        $this->assertSame(100.0, $benchmark['low_per_kg']);
        $this->assertSame(300.0, $benchmark['high_per_kg']);
        $this->assertNotNull($benchmark['first_sale_at']);
        $this->assertNotNull($benchmark['window_start']);
        $this->actingAs(User::factory()->create(['role' => 'buyer']))->get('/marketplace')->assertInertia(fn (Assert $p) => $p->where('activeListings.0.benchmark.average_per_kg', 200)->where('activeListings.0.benchmark.samples', 3));
        $this->get('/catch-listings/'.$listing->id)->assertInertia(fn (Assert $p) => $p->where('benchmark.status', 'available')->where('trace', null));
    }

    public function test_low_samples_hide_prices_and_invalid_legacy_disputed_and_out_of_window_rows_are_excluded(): void
    {
        $this->travelTo(now()->startOfDay());
        $this->completed(5, 500);
        $this->completed(10, 2000);
        $this->completed(10, 9900, ['completed_at' => now()->subDays(31), 'sale_snapshot_at' => now()->subDays(35)]);
        $this->completed(10, 9900, ['completed_at' => now()->addDay()]);
        $this->completed(10, 9900, ['completed_at' => null]);
        $this->completed(10, 9900, ['sale_snapshot_at' => null]);
        $this->completed(10, 9900, ['sale_weight_kg' => 0]);
        $this->completed(10, 9900, [], false);
        $this->completed(10, 9900, ['status' => 'refunded']);
        $this->completed(10, 9900, ['sale_port_term_id' => DB::table('vocabulary_terms')->where('code', 'port-dapitan')->value('id')]);
        $disputed = $this->completed(10, 9900);
        DB::table('order_issues')->insert(['order_id' => $disputed->id, 'reported_by' => $disputed->user_id, 'category' => 'quality', 'description' => 'Synthetic open issue', 'status' => 'open', 'created_at' => now(), 'updated_at' => now()]);
        $listing = $this->batch();
        $b = MarketBenchmarks::forListings([$listing])[$listing->id];
        $this->assertSame(2, $b['samples']);
        $this->assertSame('insufficient', $b['status']);
        $this->assertNull($b['average_per_kg']);
        $this->assertNull($b['low_per_kg']);
        $this->assertNull($b['first_sale_at']);
        $unknown = $this->batch(['fish_name' => 'Unclassified mixed catch']);
        $b = MarketBenchmarks::forListings([$unknown])[$unknown->id];
        $this->assertSame('unclassified', $b['status']);
        $this->assertSame(0, $b['samples']);
    }

    public function test_acceptance_snapshots_and_trace_are_participant_only_and_do_not_follow_later_listing_edits(): void
    {
        Event::fake();
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 5000]);
        $outsider = User::factory()->create(['role' => 'rider']);
        $catch = FishCatch::create(['user_id' => $seller->id, 'species' => 'Bangus', 'weight' => 5, 'location' => 'Galas Port', 'logged_at' => now()->subHours(2)]);
        $listing = $this->batch(['user_id' => $seller->id, 'weight_kg' => 5, 'catch_id' => $catch->id]);
        $this->actingAs($seller)->get('/catch-listings/'.$listing->id)->assertInertia(fn (Assert $p) => $p->where('trace.catch_id', $catch->id)->where('trace.order_id', null));
        $this->actingAs($buyer)->post(route('orders.store', $listing), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $order = DB::table('orders_logistics')->where('listing_id', $listing->id)->first();
        $this->assertEquals(5, $order->sale_weight_kg);
        $this->assertEquals($catch->id, $order->sale_catch_id);
        $this->assertNotNull($order->sale_species_term_id);
        $this->post('/orders/'.$order->id.'/confirm', ['pickup_otp' => $order->pickup_otp])->assertSessionHasNoErrors();
        DB::table('listings')->where('id', $listing->id)->update(['fish_name' => 'Later description', 'weight_kg' => 99, 'catch_id' => null]);
        $this->get('/orders/'.$order->id)->assertInertia(fn (Assert $p) => $p->where('order.fish_name', 'Bangus')->where('order.weight_kg', 5)->where('trace.catch_id', $catch->id)->where('trace.catch_link_basis', 'acceptance_snapshot')->has('trace.events', 7)->missing('trace.delivery_otp')->missing('trace.pickup_otp'));
        $this->get('/catch-listings/'.$listing->id)->assertInertia(fn (Assert $p) => $p->where('trace.order_id', $order->id)->where('trace.catch_id', $catch->id));
        $this->actingAs($outsider)->get('/orders/'.$order->id)->assertNotFound();
        $this->get('/catch-listings/'.$listing->id)->assertInertia(fn (Assert $p) => $p->where('trace', null));
    }

    public function test_awarded_bid_captures_facts_without_inventing_a_catch_link_or_milestones(): void
    {
        Event::fake();
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 5000]);
        $listing = $this->batch(['user_id' => $seller->id]);
        Bid::create(['listing_id' => $listing->id, 'buyer_id' => $buyer->id, 'amount' => 1200]);
        $this->actingAs($seller)->post(route('listings.accept-bid', $listing))->assertSessionHasNoErrors();
        $order = DB::table('orders_logistics')->where('listing_id', $listing->id)->first();
        $this->assertSame('Bangus', $order->sale_fish_name);
        $this->assertEquals(10, $order->sale_weight_kg);
        $this->assertNull($order->sale_catch_id);
        $this->actingAs($buyer)->get('/orders/'.$order->id)->assertInertia(fn (Assert $p) => $p->where('trace.catch_id',null)->has('trace.events',3)->where('order.picked_up_at',null));
    }
    public function test_cancelled_order_trace_uses_refund_event_without_inventing_completion_or_revealing_codes():void {
        Event::fake();$seller=User::factory()->create(['role'=>'fisherman']);$buyer=User::factory()->create(['role'=>'buyer','wallet_balance'=>2000]);
        $listing=$this->batch(['user_id'=>$seller->id]);
        $this->actingAs($buyer)->post(route('orders.store',$listing),['logistics_type'=>'self_pickup'])->assertSessionHasNoErrors();
        $order=DB::table('orders_logistics')->where('listing_id',$listing->id)->first();
        $this->post('/orders/'.$order->id.'/cancel',['reason'=>'Synthetic buyer cancellation before handover'])->assertSessionHasNoErrors();
        $this->get('/orders/'.$order->id)->assertInertia(fn(Assert $p)=>$p->where('order.status','cancelled')->where('order.completed_at',null)->has('trace.events',4)->where('trace.events',fn($events)=>$events->pluck('key')->contains('refund') && !$events->pluck('key')->contains('confirmation') && !$events->pluck('key')->contains('pickup')));
        $b=MarketBenchmarks::forListings([$listing->fresh()])[$listing->id];$this->assertSame(0,$b['samples']);$this->assertNull($b['average_per_kg']);
    }
}
