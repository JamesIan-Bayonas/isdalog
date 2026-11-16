<?php // File: isdalog/tests/Feature/PublicMarketTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PublicMarketTest extends TestCase
{
    use RefreshDatabase;

    private function batch(array $data = []): Listing
    {
        return Listing::factory()->create(array_merge(['fish_name' => 'Bangus', 'location' => 'Galas Port', 'weight_kg' => 10, 'current_bid' => 1000, 'status' => 'active', 'ends_at' => now()->addDay()], $data));
    }

    public function test_guests_receive_only_public_fields_and_only_open_unsold_positive_weight_listings(): void
    {
        $batch = $this->batch();
        $this->batch(['status' => 'completed']);
        $this->batch(['ends_at' => now()]);
        $this->batch(['withdrawn_at' => now()]);
        $this->batch(['expired_at' => now()]);
        $this->batch(['weight_kg' => 0]);
        $this->get('/market-preview')->assertOk()->assertInertia(fn (Assert $p) => $p->component('Public/Home')->has('listings.data', 1)->where('listings.data.0.id', $batch->id)->where('listings.data.0.unit_price', 100)->where('listings.data.0', fn ($row) => array_keys($row->toArray()) === ['id', 'fish_name', 'weight_kg', 'batch_price', 'unit_price', 'location', 'ends_at'])->missing('activeOrders')->missing('provenance')->where('auth.user', null));
        $this->get('/catch-listings/'.$batch->id)->assertRedirect('/login');
        $this->get('/orders')->assertRedirect('/login');
        $this->post('/listings/'.$batch->id.'/order', ['logistics_type' => 'self_pickup'])->assertRedirect('/login');
    }

    public function test_public_search_paginates_and_escapes_wildcards_and_validates_inputs(): void
    {
        for ($i = 0; $i < 11; $i++) {
            $this->batch();
        }$this->batch(['fish_name' => 'Tuna', 'location' => 'Other port']);
        $this->get('/market-preview?q=Bangus&port=Galas%20Port')->assertInertia(fn (Assert $p) => $p->has('listings.data', 9)->where('listings.total', 11)->where('listings.next_page_url', fn ($url) => str_contains($url, 'q=Bangus') && str_contains($url, 'page=2')));
        $this->get('/market-preview?q=Bangus&port=Galas%20Port&page=2')->assertInertia(fn (Assert $p) => $p->has('listings.data', 2));
        $this->get('/market-preview?q=%25')->assertInertia(fn (Assert $p) => $p->has('listings.data', 0));
        $this->get('/market-preview?page=0')->assertSessionHasErrors('page');
        $this->get('/market-preview?page=100')->assertRedirect('/market-preview?page=2');
    }

    public function test_login_and_registration_preserve_protected_catch_destination_and_role_entry_is_allowlisted(): void
    {
        $batch = $this->batch();
        $user = User::factory()->create();
        $this->get('/catch-listings/'.$batch->id)->assertRedirect('/login');
        $this->post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/catch-listings/'.$batch->id);
        $this->post('/logout');
        $this->get('/register?role=rider')->assertInertia(fn (Assert $p) => $p->where('initialRole', 'rider'));
        $this->get('/register?role=admin')->assertInertia(fn (Assert $p) => $p->where('initialRole', 'fisherman'));
        $this->get('/catch-listings/'.$batch->id)->assertRedirect('/login');
        $this->post('/register', ['name' => 'Sample Buyer', 'email' => 'public-preview@example.test', 'role' => 'buyer', 'password' => 'password', 'password_confirmation' => 'password'])->assertRedirect('/catch-listings/'.$batch->id);
        $this->assertDatabaseHas('users', ['email' => 'public-preview@example.test', 'role' => 'buyer', 'status' => 'unverified']);
    }
}
