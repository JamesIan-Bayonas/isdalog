<?php // File: isdalog/tests/Feature/SettlementLedgerTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class SettlementLedgerTest extends TestCase
{
    use RefreshDatabase;

    private function order(array $overrides = []): array
    {
        Queue::fake();
        $seller = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 0]);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 0]);
        $listing = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'completed']);
        $id = DB::table('orders_logistics')->insertGetId(array_merge([
            'listing_id' => $listing->id, 'user_id' => $buyer->id, 'fisherman_id' => $seller->id,
            'final_price' => '1000.00', 'escrow_balance' => '1000.00', 'delivery_fee' => 0,
            'logistics_type' => 'request_rider', 'status' => 'delivered', 'pickup_otp' => '123456',
            'delivery_otp' => '654321', 'created_at' => now(), 'updated_at' => now(),
        ], $overrides));
        $this->actingAs($buyer);

        return [$id, $seller, $buyer];
    }

    public function test_receipt_writes_balances_distribution_and_only_one_settlement(): void
    {
        [$id, $seller] = $this->order();
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasNoErrors();
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
        $this->assertEquals('970.00', $seller->fresh()->wallet_balance);
        $this->assertDatabaseHas('wallets', ['user_id' => $seller->id, 'balance' => 970]);
        $this->assertDatabaseHas('wallet_transactions', ['order_id' => $id, 'purpose' => 'catch_sale', 'amount' => 970, 'balance_after' => 970]);
        $this->assertDatabaseHas('order_settlements', ['order_id' => $id, 'funded_amount' => 1000, 'platform_fee' => 30, 'fisherman_amount' => 970]);
        $this->assertDatabaseCount('order_settlements', 1);
    }

    public function test_pending_or_in_transit_orders_cannot_release_money(): void
    {
        foreach (['pending_dispatch', 'en_route'] as $state) {
            [$id, $seller] = $this->order(['status' => $state]);
            $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
            $this->assertEquals(0, $seller->fresh()->wallet_balance);
        }
        $this->assertDatabaseCount('order_settlements', 0);
    }

    public function test_unfunded_delivery_fee_and_escrow_mismatch_are_rejected(): void
    {
        foreach ([['escrow_balance' => 999], ['escrow_balance' => 1001], ['delivery_fee' => 150]] as $change) {
            [$id, $seller] = $this->order($change);
            $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
            $this->assertEquals(0, $seller->fresh()->wallet_balance);
        }
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_self_pickup_requires_seller_code_and_has_no_courier_fee(): void
    {
        [$id] = $this->order(['logistics_type' => 'self_pickup', 'status' => 'pending_dispatch']);
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
        $this->post('/orders/'.$id.'/confirm', ['pickup_otp' => '000000'])->assertSessionHasErrors('error');
        $this->post('/orders/'.$id.'/confirm', ['pickup_otp' => '123456'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('order_settlements', ['order_id' => $id, 'rider_amount' => 0]);
    }

    public function test_funded_delivery_pays_exactly_the_recorded_total(): void
    {
        $rider = User::factory()->create(['role' => 'rider', 'wallet_balance' => 0]);
        [$id] = $this->order(['rider_id' => $rider->id, 'delivery_fee' => 150, 'escrow_balance' => 1150]);
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasNoErrors();
        $this->assertDatabaseHas('wallets', ['user_id' => $rider->id, 'balance' => 150]);
        $record = DB::table('order_settlements')->where('order_id', $id)->first();
        $this->assertEquals(1150, $record->fisherman_amount + $record->rider_amount + $record->platform_fee);
    }

    public function test_reconciliation_is_audited_without_adding_extra_available_funds(): void
    {
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 500]);
        Wallet::create(['user_id' => $buyer->id, 'balance' => 100]);
        $this->actingAs($buyer)->post('/wallet/deposit', ['amount' => 50])->assertSessionHasNoErrors();
        $this->assertEquals(550, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseHas('wallets', ['user_id' => $buyer->id, 'balance' => 550]);
        $this->assertDatabaseHas('wallet_transactions', ['purpose' => 'balance_reconciliation', 'amount' => 400, 'balance_after' => 500]);
    }

    public function test_review_failure_rolls_back_credits_and_settlement(): void
    {
        [$id, $seller] = $this->order();
        DB::statement("CREATE TRIGGER reject_review BEFORE INSERT ON order_reviews BEGIN SELECT RAISE(ABORT, 'Synthetic review failure'); END");
        $this->post('/orders/'.$id.'/confirm')->assertStatus(500);
        $this->assertEquals(0, $seller->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('order_settlements', 0);
        $this->assertDatabaseHas('orders_logistics', ['id' => $id, 'status' => 'delivered', 'escrow_balance' => 1000]);
    }

    public function test_ineligible_recipient_blocks_settlement(): void
    {
        [$id, $seller] = $this->order();
        $seller->update(['role' => 'buyer']);
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasErrors('error');
        $this->assertDatabaseCount('order_settlements', 0);
    }

    public function test_cent_rounding_conserves_small_purchase(): void
    {
        [$id, $seller] = $this->order(['final_price' => '0.50', 'escrow_balance' => '0.50']);
        $this->post('/orders/'.$id.'/confirm')->assertSessionHasNoErrors();
        $this->assertEquals('0.49', $seller->fresh()->wallet_balance);
        $this->assertDatabaseHas('order_settlements', ['order_id' => $id, 'fisherman_amount' => '0.49', 'platform_fee' => '0.01']);
    }

    public function test_purchase_reserves_money_in_the_wallet_ledger(): void
    {
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = Listing::factory()->create(['user_id' => $seller->id, 'current_bid' => 600, 'status' => 'active']);
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertSessionHasNoErrors();
        $id = DB::table('orders_logistics')->value('id');
        $this->assertDatabaseHas('wallet_transactions', ['order_id' => $id, 'purpose' => 'escrow_reservation', 'type' => 'debit', 'amount' => 600, 'balance_after' => 400]);
        $this->assertDatabaseHas('wallets', ['user_id' => $buyer->id, 'balance' => 400]);
    }

    public function test_ledger_failure_prevents_all_payouts(): void
    {
        [$id, $seller] = $this->order();
        DB::statement("CREATE TRIGGER reject_ledger BEFORE INSERT ON wallet_transactions BEGIN SELECT RAISE(ABORT, 'Synthetic ledger failure'); END");
        $this->post('/orders/'.$id.'/confirm')->assertStatus(500);
        $this->assertEquals(0, $seller->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
        $this->assertDatabaseCount('order_settlements', 0);
        $this->assertDatabaseCount('order_reviews', 0);
    }

    public function test_awarded_offer_records_reservation_and_balances(): void
    {
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $batch = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'active']);
        \App\Models\Bid::create(['listing_id' => $batch->id, 'buyer_id' => $buyer->id, 'amount' => 600]);
        $this->actingAs($seller)->post(route('listings.accept-bid', $batch))->assertSessionHasNoErrors();
        $this->assertDatabaseHas('wallet_transactions', ['purpose' => 'escrow_reservation', 'amount' => 600, 'balance_after' => 400]);
        $this->assertDatabaseHas('wallets', ['user_id' => $buyer->id, 'balance' => 400]);
    }
}
