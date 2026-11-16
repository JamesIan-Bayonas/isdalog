<?php // File: isdalog/tests/Feature/WithdrawalPayoutTest.php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Models\WithdrawalPayout;
use App\Models\WithdrawalRequest;
use App\Services\PayoutDisbursementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WithdrawalPayoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['payouts.driver' => 'sandbox', 'payouts.callback_secret' => 'isolated-test-secret']);
        Http::preventStrayRequests();
    }

    private function approved(string $method = 'gcash'): array
    {
        $owner = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 500]);
        $this->actingAs($owner)->post('/wallet/withdraw', ['amount' => 200, 'payout_method' => $method,
            'account_name' => 'Test Fisherman', 'account_number' => '09000000000'])->assertSessionHasNoErrors();
        $record = WithdrawalRequest::firstOrFail();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->patch("/admin/withdrawals/{$record->id}/review", ['decision' => 'approved', 'review_note' => 'Checked.'])->assertSessionHasNoErrors();
        return [$owner, $record, $admin];
    }

    private function start(WithdrawalRequest $record)
    {
        return $this->post("/admin/withdrawals/{$record->id}/payout");
    }

    private function payload(WithdrawalPayout $payout, string $status = 'paid'): array
    {
        return ['event_id' => 'event-1', 'reference' => $payout->reference,
            'amount' => '200.00', 'currency' => 'PHP', 'status' => $status,
            'failure_reason' => $status === 'failed' ? 'Simulated destination unavailable.' : null];
    }

    private function postCallback(array $payload, ?string $secret = null, ?int $time = null)
    {
        $raw = json_encode($payload);
        $stamp = (string) ($time ?? now()->timestamp);
        return $this->call('POST', '/api/payouts/callback', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_ACCEPT' => 'application/json',
            'HTTP_X_PAYOUT_TIMESTAMP' => $stamp,
            'HTTP_X_PAYOUT_SIGNATURE' => hash_hmac('sha256', $stamp.'.'.$raw, $secret ?? 'isolated-test-secret'),
        ], $raw);
    }

    public function test_start_persists_one_processing_simulation_without_another_debit(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record)->assertSessionHasNoErrors();
        $payout = WithdrawalPayout::firstOrFail();
        $this->assertEquals('processing', $payout->status);
        $this->assertEquals('sandbox', $payout->mode);
        $this->assertStringStartsWith('SIM-DSB-', $payout->provider_reference);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->start($record)->assertSessionHasErrors('payout');
        $this->assertDatabaseCount('withdrawal_payouts', 1);
        $this->assertDatabaseCount('wallet_transactions', 2);
    }

    public function test_signed_completion_is_idempotent_and_failure_cannot_reverse_it(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        $payload = $this->payload($payout);
        $this->postCallback($payload)->assertOk()->assertJson(['result' => 'recorded']);
        $this->postCallback($payload)->assertOk()->assertJson(['result' => 'duplicate']);
        $this->postCallback(array_merge($this->payload($payout, 'failed'), ['event_id' => 'late-failure']))->assertStatus(409);
        $this->assertEquals('paid', $payout->fresh()->status);
        $this->assertNotNull($payout->fresh()->paid_at);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('payout_events', 1);
        $this->assertDatabaseCount('wallet_transactions', 2);
    }

    public function test_signed_failure_returns_funds_once_and_blocks_new_attempt_on_same_request(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        $payload = $this->payload($payout, 'failed');
        $this->postCallback($payload)->assertOk();
        $this->postCallback($payload)->assertOk()->assertJson(['result' => 'duplicate']);
        $this->postCallback(array_merge($payload, ['event_id' => 'second-failure']))->assertStatus(409);
        $this->start($record)->assertSessionHasErrors('payout');
        $this->assertEquals(500, $owner->fresh()->wallet_balance);
        $this->assertEquals('failed', $payout->fresh()->status);
        $this->assertNotNull($payout->fresh()->refunded_at);
        $this->assertDatabaseHas('wallet_transactions', ['id' => $record->fresh()->refund_transaction_id,
            'type' => 'credit', 'purpose' => 'withdrawal_refund', 'amount' => 200, 'balance_after' => 500]);
        $this->assertDatabaseCount('wallet_transactions', 3);
    }

    public function test_invalid_signature_and_expired_timestamp_do_not_change_money(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        $this->postCallback($this->payload($payout, 'failed'), 'wrong-secret')->assertUnauthorized();
        $this->postCallback($this->payload($payout, 'failed'), time: now()->timestamp - 301)->assertUnauthorized();
        $this->assertEquals('processing', $payout->fresh()->status);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('payout_events', 0);
    }

    public function test_amount_currency_and_reused_event_id_are_validated(): void
    {
        [, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        $payload = $this->payload($payout);
        $this->postCallback(array_merge($payload, ['amount' => '200.01']))->assertStatus(422);
        $this->postCallback(array_merge($payload, ['currency' => 'USD']))->assertStatus(422);
        $this->postCallback(array_merge($payload, ['amount' => 200]))->assertStatus(422);
        $this->postCallback($payload)->assertOk();
        $this->postCallback($this->payload($payout, 'failed'))->assertStatus(409);
        $this->assertDatabaseCount('payout_events', 1);
    }

    public function test_disabled_driver_or_missing_secret_cannot_claim_success(): void
    {
        [, $record] = $this->approved();
        config(['payouts.driver' => 'disabled']);
        $this->start($record)->assertStatus(503);
        $this->assertFalse(PayoutDisbursementService::disburse('gcash', '09000000000', 'Fixture', 200)['success']);
        config(['payouts.driver' => 'sandbox', 'payouts.callback_secret' => null]);
        $this->start($record)->assertSessionHasNoErrors();
        $this->postCallback($this->payload(WithdrawalPayout::firstOrFail()))->assertStatus(503);
    }

    public function test_production_cannot_enable_the_simulator(): void
    {
        [, $record] = $this->approved();
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->app['env'] = 'production';
        $this->start($record)->assertStatus(503);
        $this->assertFalse(PayoutDisbursementService::disburse('gcash', '09000000000', 'Fixture', 200)['success']);
        $this->assertDatabaseCount('withdrawal_payouts', 0);
    }

    public function test_nonadmin_cannot_start_or_simulate_and_only_gcash_is_enabled(): void
    {
        [$owner, $record, $admin] = $this->approved('maya');
        $this->start($record)->assertSessionHasErrors('payout');
        foreach (['fisherman', 'buyer', 'rider'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->start($record)->assertForbidden();
            $this->post("/admin/withdrawals/{$record->id}/simulate", ['outcome' => 'paid'])->assertForbidden();
        }
        $this->assertDatabaseCount('withdrawal_payouts', 0);
    }

    public function test_nonapproved_requests_and_guest_actions_are_blocked(): void
    {
        [, $record] = $this->approved();
        $record->refresh();
        foreach (['pending', 'rejected'] as $status) {
            $record->status = $status;
            $record->save();
            $this->start($record)->assertSessionHasErrors('payout');
        }
        $this->assertDatabaseCount('withdrawal_payouts', 0);
        auth()->logout();
        $this->post("/admin/withdrawals/{$record->id}/payout")->assertRedirect('/login');
        $this->post("/admin/withdrawals/{$record->id}/simulate", ['outcome' => 'paid'])->assertRedirect('/login');
    }

    public function test_repeated_admin_simulation_returns_a_form_error_without_a_second_refund(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $url = "/admin/withdrawals/{$record->id}/simulate";
        $this->post($url, ['outcome' => 'failed'])->assertSessionHasNoErrors();
        $this->post($url, ['outcome' => 'failed'])->assertSessionHasErrors('payout');
        $this->assertEquals(500, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('payout_events', 1);
        $this->assertDatabaseCount('wallet_transactions', 3);
    }

    public function test_owner_history_exposes_simulated_status_reference_and_failure_without_full_account(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        $this->postCallback($this->payload($payout, 'failed'))->assertOk();
        $this->actingAs($owner)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('withdrawalHistory.0.payout.reference', $payout->reference)
            ->where('withdrawalHistory.0.payout.status', 'failed')
            ->where('withdrawalHistory.0.payout.mode', 'sandbox')
            ->where('withdrawalHistory.0.payout.failure_reason', 'Simulated destination unavailable.')
            ->missing('withdrawalHistory.0.account_number')->missing('withdrawalHistory.0.payout.initiated_by'));
    }

    public function test_refund_ledger_failure_rolls_back_callback_status_balance_and_event(): void
    {
        [$owner, $record] = $this->approved();
        $this->start($record);
        $payout = WithdrawalPayout::firstOrFail();
        Event::listen('eloquent.creating: '.WalletTransaction::class, fn () => throw new \RuntimeException('Simulated refund ledger failure'));
        try {
            $this->withoutExceptionHandling();
            $this->postCallback($this->payload($payout, 'failed'));
            $this->fail('Expected ledger failure');
        } catch (\RuntimeException $exception) {
            $this->assertEquals('Simulated refund ledger failure', $exception->getMessage());
        } finally {
            Event::forget('eloquent.creating: '.WalletTransaction::class);
        }
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertEquals('processing', $payout->fresh()->status);
        $this->assertNull($record->fresh()->refund_transaction_id);
        $this->assertDatabaseCount('payout_events', 0);
    }
}
