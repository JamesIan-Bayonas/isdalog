<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class WalletWithdrawalTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_fisherman_can_withdraw_wallet_funds(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 5000.00,
        ]);

        $response = $this->actingAs($fisherman)->post('/wallet/withdraw', [
            'amount' => 2000.00,
            'payout_method' => 'gcash',
            'account_number' => '09171234567',
            'account_name' => 'Juan Dela Cruz',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        $this->assertEquals(3000.00, (float) $fisherman->fresh()->wallet_balance);
    }

    public function test_withdrawal_executes_disbursement_gateway_logging(): void
    {
        Log::spy();

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 3500.00,
        ]);

        $response = $this->actingAs($fisherman)->post('/wallet/withdraw', [
            'amount' => 1500.00,
            'payout_method' => 'maya',
            'account_number' => '09189876543',
            'account_name' => 'Pedro Penduko',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        $this->assertEquals(2000.00, (float) $fisherman->fresh()->wallet_balance);

        Log::shouldHaveReceived('info')
            ->withArgs(function ($message) {
                return str_contains($message, 'ISDALOG AUTOMATED PAYOUT GATEWAY DISPATCH');
            });
    }

    public function test_withdrawal_fails_if_amount_exceeds_wallet_balance(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 500.00,
        ]);

        $response = $this->actingAs($fisherman)->post('/wallet/withdraw', [
            'amount' => 1000.00,
            'payout_method' => 'gcash',
            'account_number' => '09171234567',
            'account_name' => 'Juan Dela Cruz',
        ]);

        $response->assertSessionHasErrors('amount');
        $this->assertEquals(500.00, (float) $fisherman->fresh()->wallet_balance);
    }

    public function test_withdrawal_fails_if_amount_is_below_minimum_threshold(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'wallet_balance' => 1000.00,
        ]);

        $response = $this->actingAs($fisherman)->post('/wallet/withdraw', [
            'amount' => 50.00,
            'payout_method' => 'maya',
            'account_number' => '09181234567',
            'account_name' => 'Juan Dela Cruz',
        ]);

        $response->assertSessionHasErrors('amount');
        $this->assertEquals(1000.00, (float) $fisherman->fresh()->wallet_balance);
    }

    public function test_unauthenticated_user_cannot_withdraw_funds(): void
    {
        $response = $this->post('/wallet/withdraw', [
            'amount' => 500.00,
            'payout_method' => 'gcash',
            'account_number' => '09171234567',  
            'account_name' => 'Test User',
        ]);

        $response->assertRedirect('/login');
    }
}