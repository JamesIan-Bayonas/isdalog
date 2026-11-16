<?php // File: isdalog/tests/Feature/WithdrawalNotificationTest.php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WithdrawalNotification;
use App\Models\WithdrawalRequest;
use App\Services\WithdrawalPayoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WithdrawalNotificationTest extends TestCase
{
    use RefreshDatabase;

    private function reserve(): array
    {
        $owner = User::factory()->create(['role' => 'fisherman', 'wallet_balance' => 500]);
        $this->actingAs($owner)->post('/wallet/withdraw', ['amount' => 200, 'payout_method' => 'gcash',
            'account_name' => 'Test Owner', 'account_number' => '09000000000'])->assertSessionHasNoErrors();
        return [$owner, WithdrawalRequest::firstOrFail(), User::factory()->create(['role' => 'admin'])];
    }

    private function review($admin, $record, string $decision = 'approved')
    {
        return $this->actingAs($admin)->patch("/admin/withdrawals/{$record->id}/review", [
            'decision' => $decision, 'review_note' => 'Destination checked.',
        ]);
    }

    public function test_approval_and_rejection_create_one_clear_owner_notification(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->review($admin, $record, 'rejected')->assertSessionHasNoErrors();
        $this->review($admin, $record, 'rejected')->assertSessionHasErrors('decision');
        $notice = WithdrawalNotification::firstOrFail();
        $this->assertEquals($owner->id, $notice->user_id);
        $this->assertEquals('review_rejected', $notice->kind);
        $this->assertStringContainsString('funds returned', $notice->title);
        $this->assertStringContainsString('Destination checked.', $notice->message);
        $this->assertStringNotContainsString('09000000000', $notice->message);
        $this->assertDatabaseCount('withdrawal_notifications', 1);
        $this->actingAs($owner)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->where('withdrawalUnreadCount', 1));
    }

    public function test_payout_failure_replay_does_not_duplicate_notifications_or_refunds(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->review($admin, $record)->assertSessionHasNoErrors();
        config(['payouts.driver' => 'sandbox']);
        $service = app(WithdrawalPayoutService::class);
        $payout = $service->start($record, $admin);
        $payload = ['event_id' => 'test-failure', 'reference' => $payout->reference,
            'status' => 'failed', 'amount' => '200.00', 'currency' => 'PHP', 'failure_reason' => 'Simulated failure.'];
        $this->assertEquals('recorded', $service->reconcile($payload));
        $this->assertEquals('duplicate', $service->reconcile($payload));
        $notice = WithdrawalNotification::where('kind', 'payout_failed')->firstOrFail();
        $this->assertStringContainsString('Simulation', $notice->title);
        $this->assertStringContainsString('returned', $notice->message);
        $this->assertDatabaseCount('withdrawal_notifications', 2);
        $this->assertEquals(500, $owner->fresh()->wallet_balance);
    }

    public function test_simulated_completion_never_claims_a_real_gcash_payment(): void
    {
        [, $record, $admin] = $this->reserve();
        $this->review($admin, $record);
        config(['payouts.driver' => 'sandbox']);
        $service = app(WithdrawalPayoutService::class);
        $payout = $service->start($record, $admin);
        $service->reconcile(['event_id' => 'test-complete', 'reference' => $payout->reference,
            'status' => 'paid', 'amount' => '200.00', 'currency' => 'PHP']);
        $notice = WithdrawalNotification::where('kind', 'payout_paid')->firstOrFail();
        $this->assertStringContainsString('no real GCash payment', $notice->title);
        $this->assertStringContainsString('No real money was sent', $notice->message);
    }

    public function test_inbox_read_open_and_read_all_are_owner_scoped(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->review($admin, $record);
        $notice = WithdrawalNotification::firstOrFail();
        $other = User::factory()->create(['role' => 'fisherman']);
        WithdrawalNotification::create(['user_id' => $other->id, 'withdrawal_request_id' => $record->id,
            'kind' => 'fixture-other', 'title' => 'Other private update', 'message' => 'Private.']);
        $this->actingAs($other)->patch("/notifications/{$notice->id}/read")->assertNotFound();
        $this->post("/notifications/{$notice->id}/open")->assertNotFound();
        $this->actingAs($owner)->get('/notifications')->assertInertia(fn (Assert $page) => $page
            ->component('Notifications/Index')->has('notifications.data', 1)->where('withdrawalUnreadCount', 1));
        $this->from('/notifications')->patch('/notifications/read-all')->assertRedirect('/notifications');
        $this->assertNotNull($notice->fresh()->read_at);
        $this->assertNull(WithdrawalNotification::where('user_id', $other->id)->first()->read_at);
        $readTime = $notice->fresh()->read_at->toIso8601String();
        $this->travel(1)->minutes();
        $this->patch("/notifications/{$notice->id}/read");
        $this->assertEquals($readTime, $notice->fresh()->read_at->toIso8601String());
        $this->post("/notifications/{$notice->id}/open")->assertRedirect(route('dashboard', ['withdrawal' => $record->id]));
        $this->get('/notifications?filter=unread')->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 0)->where('withdrawalUnreadCount', 0));
    }

    public function test_guest_is_denied_and_all_roles_can_operate_only_their_inbox(): void
    {
        $this->get('/notifications')->assertRedirect('/login');
        $this->patch('/notifications/read-all')->assertRedirect('/login');
        foreach (['buyer', 'rider', 'admin'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]));
            $this->get('/notifications')->assertOk();
            $this->patch('/notifications/read-all')->assertRedirect();
            $this->post('/notifications/1/open')->assertNotFound();
        }
    }

    public function test_inbox_paginates_and_counts_all_owned_unread_records(): void
    {
        [$owner, $record] = $this->reserve();
        for ($i = 0; $i < 21; $i++) {
            WithdrawalNotification::create(['user_id' => $owner->id, 'withdrawal_request_id' => $record->id,
                'kind' => 'fixture-'.$i, 'title' => 'Test update', 'message' => 'Test.']);
        }
        $this->actingAs($owner)->get('/notifications')->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 20)->where('notifications.total', 21)->where('withdrawalUnreadCount', 21));
        $this->get('/notifications?page=2')->assertInertia(fn (Assert $page) => $page->has('notifications.data', 1));
    }

    public function test_notification_storage_failure_rolls_back_review_and_refund(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        Event::listen('eloquent.creating: '.WithdrawalNotification::class, fn () => throw new \RuntimeException('Notification storage failed'));
        try {
            $this->withoutExceptionHandling();
            $this->review($admin, $record, 'rejected');
            $this->fail('Expected failure');
        } catch (\RuntimeException $exception) {
            $this->assertEquals('Notification storage failed', $exception->getMessage());
        } finally {
            Event::forget('eloquent.creating: '.WithdrawalNotification::class);
        }
        $this->assertEquals('pending', $record->fresh()->status);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 2);
        $this->assertDatabaseCount('withdrawal_notifications', 0);
    }

    public function test_notification_failure_rolls_back_payout_outcome_and_event(): void
    {
        [$owner, $record, $admin] = $this->reserve();
        $this->review($admin, $record);
        config(['payouts.driver' => 'sandbox']);
        $service = app(WithdrawalPayoutService::class);
        $payout = $service->start($record, $admin);
        Event::listen('eloquent.creating: '.WithdrawalNotification::class, fn () => throw new \RuntimeException('Notice failed'));
        try {
            $service->reconcile(['event_id' => 'rollback-event', 'reference' => $payout->reference,
                'status' => 'failed', 'amount' => '200.00', 'currency' => 'PHP', 'failure_reason' => 'Simulated failure.']);
            $this->fail('Expected notification failure');
        } catch (\RuntimeException $exception) {
            $this->assertEquals('Notice failed', $exception->getMessage());
        } finally {
            Event::forget('eloquent.creating: '.WithdrawalNotification::class);
        }
        $this->assertEquals('processing', $payout->fresh()->status);
        $this->assertEquals(300, $owner->fresh()->wallet_balance);
        $this->assertNull($record->fresh()->refund_transaction_id);
        $this->assertDatabaseCount('payout_events', 0);
        $this->assertDatabaseCount('withdrawal_notifications', 1);
    }
}
