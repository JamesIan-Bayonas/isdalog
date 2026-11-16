<?php // File: isdalog/tests/Feature/WithdrawalReviewTest.php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WalletTransaction;
use App\Models\WithdrawalRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WithdrawalReviewTest extends TestCase
{
    use RefreshDatabase;

    private function reserve(): array
    {
        $owner = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 500]);
        $this->actingAs($owner)->post('/wallet/withdraw', [
            'amount' => 200, 'payout_method' => 'gcash',
            'account_name' => 'Test Fisherman', 'account_number' => '09000000000',
        ])->assertSessionHasNoErrors();
        return [$owner, WithdrawalRequest::firstOrFail(), User::factory()->create(['role' => 'admin'])];
    }

    private function review(WithdrawalRequest $record, string $decision, string $note = 'Destination checked.')
    {
        return $this->patch("/admin/withdrawals/{$record->id}/review", ['decision' => $decision, 'review_note' => $note]);
    }

    public function test_rejection_returns_funds_once_and_records_reviewer_reason_and_refund(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->actingAs($admin);
        $this->review($record, 'rejected', 'Account details need correction.')->assertSessionHasNoErrors();
        $record->refresh();
        $this->assertEquals(500, $owner->fresh()->wallet_balance);
        $this->assertDatabaseHas('wallets', ['user_id' => $owner->id, 'balance' => 500]);
        $this->assertEquals('rejected', $record->status);
        $this->assertEquals($admin->id, $record->reviewed_by);
        $this->assertEquals($admin->name, $record->reviewer_name);
        $this->assertNotNull($record->reviewed_at);
        $this->assertDatabaseHas('wallet_transactions', ['id' => $record->refund_transaction_id,
            'type' => 'credit', 'purpose' => 'withdrawal_refund', 'amount' => 200, 'balance_after' => 500]);
        $this->review($record, 'rejected')->assertSessionHasErrors('decision');
        $this->review($record, 'approved')->assertSessionHasErrors('decision');
        $this->assertEquals(500, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 3);
        $this->assertEquals('Account details need correction.', $record->fresh()->review_note);
    }

    public function test_approval_keeps_funds_reserved_and_cannot_be_reversed_or_refunded(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->actingAs($admin);
        $this->review($record, 'approved')->assertSessionHasNoErrors();
        $this->assertEquals('approved', $record->fresh()->status);
        $this->assertNull($record->fresh()->refund_transaction_id);
        $this->review($record, 'approved')->assertSessionHasErrors('decision');
        $this->review($record, 'rejected')->assertSessionHasErrors('decision');
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 2);
    }

    public function test_review_success_message_is_visible_on_the_queue(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->actingAs($admin)->from('/admin/withdrawals');
        $this->review($record, 'approved')->assertRedirect('/admin/withdrawals');
        $this->get('/admin/withdrawals')->assertInertia(fn (Assert $page) => $page
            ->where('flash.success', 'Withdrawal approved for payout. Funds remain reserved; no provider payment has been made.'));
    }

    public function test_only_admin_can_view_or_review_requests(): void
    {
        [$owner, $record] = $this->reserve();
        foreach (['fisherman', 'buyer', 'rider'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->get('/admin/withdrawals')->assertForbidden();
            $this->review($record, 'rejected')->assertForbidden();
        }
        $this->assertEquals('pending', $record->fresh()->status);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
    }

    public function test_guests_cannot_view_or_review_requests(): void
    {
        $this->get('/admin/withdrawals')->assertRedirect('/login');
        $this->patch('/admin/withdrawals/1/review', [])->assertRedirect('/login');
    }

    public function test_decision_and_nonblank_reason_are_required(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->actingAs($admin);
        $this->review($record, 'paid', '')->assertSessionHasErrors(['decision', 'review_note']);
        $this->review($record, 'rejected', '   ')->assertSessionHasErrors('review_note');
        $this->review($record, 'rejected', str_repeat('a', 501))->assertSessionHasErrors('review_note');
        $this->assertEquals('pending', $record->fresh()->status);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
    }

    public function test_fisherman_sees_review_reason_and_refund_without_destination_disclosure(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->actingAs($admin);
        $this->review($record, 'rejected', 'Please correct the account number.');
        $this->actingAs($owner)->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('withdrawalHistory.0.status', 'rejected')
            ->where('withdrawalHistory.0.review_note', 'Please correct the account number.')
            ->where('withdrawalHistory.0.refund_transaction_id', $record->fresh()->refund_transaction_id)
            ->where('metrics.walletBalance', 500)
            ->missing('withdrawalHistory.0.account_number')->missing('withdrawalHistory.0.reviewed_by'));
    }

    public function test_admin_status_filter_and_pagination(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        for ($i = 0; $i < 21; $i++) {
            WithdrawalRequest::create(['user_id' => $owner->id, 'amount' => 100,
                'payment_method' => 'maya', 'account_name' => 'Fixture', 'account_number' => '09000000000', 'status' => 'approved']);
        }
        $this->actingAs($admin)->get('/admin/withdrawals')->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Withdrawals')->where('withdrawals.total', 1)->where('filters.status', 'pending'));
        $this->get('/admin/withdrawals?status=approved')->assertInertia(fn (Assert $page) => $page
            ->has('withdrawals.data', 20)->where('withdrawals.total', 21));
        $this->get('/admin/withdrawals?status=approved&page=2')->assertInertia(fn (Assert $page) => $page
            ->has('withdrawals.data', 1)->where('filters.status', 'approved'));
        $this->get('/admin/withdrawals?status=all')->assertInertia(fn (Assert $page) => $page->where('withdrawals.total', 22));
    }

    public function test_refund_failure_rolls_back_balance_status_and_audit(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        Event::listen('eloquent.creating: '.WalletTransaction::class, function () {
            throw new \RuntimeException('Simulated ledger failure');
        });
        try {
            $this->withoutExceptionHandling()->actingAs($admin);
            $this->review($record, 'rejected');
            $this->fail('The simulated ledger failure should abort the review.');
        } catch (\RuntimeException $exception) {
            $this->assertEquals('Simulated ledger failure', $exception->getMessage());
        } finally {
            Event::forget('eloquent.creating: '.WalletTransaction::class);
        }
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertDatabaseHas('wallets', ['user_id' => $owner->id, 'balance' => 300]);
        $this->assertEquals('pending', $record->fresh()->status);
        $this->assertNull($record->fresh()->reviewed_at);
        $this->assertDatabaseCount('wallet_transactions', 2);
    }
}
