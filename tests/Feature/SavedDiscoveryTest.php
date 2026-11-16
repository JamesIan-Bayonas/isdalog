<?php // File: isdalog/tests/Feature/SavedDiscoveryTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SavedDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_favorites_are_private_idempotent_and_show_closed_listings(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $listing = Listing::factory()->create(['status' => 'active', 'ends_at' => now()->addDay()]);
        $url = route('saved.favorite', $listing);

        $this->actingAs($owner)->put($url, ['saved' => true])->assertSessionHasNoErrors();
        $this->put($url, ['saved' => true])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('favorite_listings', 1);
        $this->assertDatabaseCount('bids', 0);
        $this->get('/marketplace')->assertInertia(fn (Assert $page) => $page->where('activeListings.0.is_favorite', true));
        $listing->update(['status' => 'completed']);
        $this->get('/saved-discovery')->assertInertia(fn (Assert $page) => $page->where('favorites.data.0.available', 0));

        $this->actingAs($other)->put($url, ['saved' => false])->assertSessionHasNoErrors();
        $this->get('/saved-discovery')->assertInertia(fn (Assert $page) => $page->has('favorites.data', 0));
        $this->assertDatabaseCount('favorite_listings', 1);
        $this->actingAs($owner)->put($url, ['saved' => false])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('favorite_listings', 0);
    }

    public function test_saved_searches_validate_and_replay_filters_without_saving_page_or_sending_alerts(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $url = route('saved.search.store');
        $this->actingAs($owner)->post($url, ['name' => 'Morning market', 'min_price' => 90, 'max_price' => 50])->assertSessionHasErrors('max_price');
        $this->post($url, ['name' => 'Morning market', 'q' => 'Bangus', 'page' => 2])->assertSessionHasNoErrors();
        $this->post($url, ['name' => 'Morning market', 'q' => 'Milkfish', 'max_price' => 120])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('saved_market_searches', 1);
        $this->assertDatabaseCount('withdrawal_notifications', 0);
        $this->get('/saved-discovery')->assertInertia(fn (Assert $page) => $page->where('searches.data.0.filters.q', 'Milkfish')->missing('searches.data.0.filters.page'));
        $id = DB::table('saved_market_searches')->value('id');
        $delete = route('saved.search.destroy', $id);
        $this->actingAs($other)->delete($delete)->assertNotFound();
        $this->get('/saved-discovery')->assertInertia(fn (Assert $page) => $page->has('searches.data', 0));
        $this->actingAs($owner)->delete($delete)->assertRedirect();
        $this->assertDatabaseCount('saved_market_searches', 0);
    }

    public function test_repeat_inquiry_is_private_and_creates_only_one_inquiry_and_reply(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 500]);
        $seller = User::factory()->create(['role' => 'fisherman']);
        $rider = User::factory()->create(['role' => 'rider']);
        $listing = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'completed']);
        $order = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id, 'user_id' => $buyer->id, 'fisherman_id' => $seller->id,
            'rider_id' => $rider->id, 'final_price' => 100, 'escrow_balance' => 0,
            'status' => 'delivered', 'logistics_type' => 'request_rider', 'created_at' => now(),
        ]);
        $url = route('orders.repeat.store', $order);
        $this->actingAs($buyer)->post($url, ['message' => 'Any stock this week?'])->assertForbidden();
        DB::table('orders_logistics')->where('id', $order)->update(['status' => 'completed']);
        $this->actingAs($rider)->post($url, ['message' => 'Any stock this week?'])->assertNotFound();

        $this->actingAs($buyer)->post($url, ['message' => 'Any stock this week?'])->assertSessionHasNoErrors();
        $this->post($url, ['message' => 'Duplicate request'])->assertSessionHasNoErrors();
        $this->assertDatabaseCount('repeat_inquiries', 1);
        $this->assertDatabaseHas('withdrawal_notifications', ['user_id' => $seller->id, 'event_key' => "order:$order:repeat-inquiry"]);
        $this->actingAs($rider)->get("/orders/$order")->assertInertia(fn (Assert $page) => $page->where('repeatInquiry', null));
        $this->patch($url, ['reply' => 'I am not the seller'])->assertNotFound();

        $this->actingAs($seller)->get("/orders/$order")->assertInertia(fn (Assert $page) => $page->where('canReplyAgain', true));
        $this->patch($url, ['reply' => 'Please check my next listing for availability.'])->assertSessionHasNoErrors();
        $this->patch($url, ['reply' => 'Duplicate reply'])->assertSessionHasErrors('reply');
        $this->actingAs($buyer)->get("/orders/$order")->assertInertia(fn (Assert $page) => $page
            ->where('repeatInquiry.message', 'Any stock this week?')
            ->where('repeatInquiry.reply', 'Please check my next listing for availability.'));
        $this->assertDatabaseHas('withdrawal_notifications', ['user_id' => $buyer->id, 'event_key' => "order:$order:repeat-reply"]);
        $this->assertDatabaseCount('withdrawal_notifications', 2);
        $this->assertDatabaseCount('orders_logistics', 1);
        $this->assertEquals(500, $buyer->fresh()->wallet_balance);
    }
}
