<?php // File: isdalog/tests/Feature/FishermanPaymentsTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class FishermanPaymentsTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return array_merge(['amount' => 300, 'payout_method' => 'gcash',
            'account_name' => 'Preview User', 'account_number' => '09171234567'], $overrides);
    }

    public function test_repeated_requests_cannot_spend_reserved_balance(): void
    {
        $user = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 500]);
        $this->actingAs($user)->post('/wallet/withdraw', $this->payload())->assertSessionHasNoErrors();
        $this->post('/wallet/withdraw', $this->payload())->assertSessionHasErrors('amount');
        $this->assertEquals(200, $user->fresh()->wallet_balance);
        $this->assertDatabaseCount('withdrawal_requests', 1);
        $this->assertDatabaseCount('wallet_transactions', 2);
        $this->assertDatabaseHas('wallets', ['user_id' => $user->id, 'balance' => 200]);
    }

    public function test_unsupported_destination_and_fractional_cents_do_not_reserve_money(): void
    {
        $user = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 500]);
        $this->actingAs($user)->post('/wallet/withdraw', $this->payload(['payout_method' => 'bank_transfer']))->assertSessionHasErrors('payout_method');
        $this->post('/wallet/withdraw', $this->payload(['amount' => '100.001']))->assertSessionHasErrors('amount');
        $this->assertEquals(500, $user->fresh()->wallet_balance);
        $this->assertDatabaseCount('withdrawal_requests', 0);
    }

    public function test_other_roles_cannot_use_fisherman_withdrawal(): void
    {
        foreach (['buyer', 'rider', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role, 'wallet_balance' => 500]);
            $this->actingAs($user)->post('/wallet/withdraw', $this->payload())->assertForbidden();
        }
        $this->assertDatabaseCount('withdrawal_requests', 0);
    }

    public function test_dashboard_returns_only_owned_masked_requests(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $other = User::factory()->create(['role' => 'fisherman']);
        foreach ([$owner, $other] as $user) {
            WithdrawalRequest::create(['user_id' => $user->id, 'amount' => 100,
                'payment_method' => 'gcash', 'account_name' => 'Private Name',
                'account_number' => '09171234567', 'status' => 'pending']);
        }
        $this->actingAs($owner)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')->has('withdrawalHistory', 1)
            ->where('withdrawalHistory.0.account_last_four', '4567')
            ->where('withdrawalHistory.0.status', 'pending')
            ->missing('withdrawalHistory.0.account_number')->missing('withdrawalHistory.0.account_name'));
    }

    public function test_second_order_cannot_charge_a_closed_listing(): void
    {
        $fisherman = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $listing = Listing::create(['user_id' => $fisherman->id, 'fish_name' => 'Catch',
            'weight_kg' => 5, 'starting_price' => 300, 'current_bid' => 300,
            'location' => 'Port', 'status' => 'active']);
        $this->actingAs($buyer)->post("/listings/{$listing->id}/order", ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $this->post("/listings/{$listing->id}/order", ['logistics_type' => 'self_pickup'])->assertSessionHasErrors('error');
        $this->assertEquals(700, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('orders_logistics', 1);
    }

    public function test_order_rejects_underfunding_and_cannot_bypass_an_auction_offer(): void
    {
        $fisherman = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 100]);
        $listing = Listing::create(['user_id' => $fisherman->id, 'fish_name' => 'Catch',
            'weight_kg' => 5, 'starting_price' => 300, 'current_bid' => 300,
            'location' => 'Port', 'status' => 'active']);
        $url = "/listings/{$listing->id}/order";
        $this->actingAs($buyer)->post($url, ['logistics_type' => 'request_rider'])->assertSessionHasErrors('error');
        $buyer->update(['wallet_balance' => 1000]);
        $listing->bids()->create(['buyer_id' => $buyer->id, 'amount' => 400]);
        $this->post($url, ['logistics_type' => 'request_rider'])->assertSessionHasErrors('error');
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->assertEquals('active', $listing->fresh()->status);
        $this->assertDatabaseCount('orders_logistics', 0);
    }

    public function test_fisherman_cannot_create_a_buyer_order(): void
    {
        $user = User::factory()->create(['role' => 'fisherman']);
        $listing = Listing::create(['user_id' => $user->id, 'fish_name' => 'Catch',
            'weight_kg' => 5, 'starting_price' => 300, 'current_bid' => 300,
            'location' => 'Port', 'status' => 'active']);
        $this->actingAs($user)->post("/listings/{$listing->id}/order", ['logistics_type' => 'self_pickup'])->assertForbidden();
        $this->assertDatabaseCount('orders_logistics', 0);
    }
}
