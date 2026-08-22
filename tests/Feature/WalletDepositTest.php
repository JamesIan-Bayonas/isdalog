<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletDepositTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_deposit_funds_into_wallet(): void
    {
        /** @var \App\Models\User $user */
        $user = User::factory()->create([
            'role' => 'buyer',
            'status' => 'verified',
            'wallet_balance' => 500.00,
        ]);

        $response = $this->actingAs($user)->post(route('wallet.deposit'), [
            'amount' => 1500.00,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // 1. Verify User table balance increment
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'wallet_balance' => 2000.00,
        ]);

        // 2. Verify Wallets ledger row
        $this->assertDatabaseHas('wallets', [
            'user_id' => $user->id,
            'balance' => 1500.00,
        ]);

        // 3. Verify Wallet Transaction audit record
        $this->assertDatabaseHas('wallet_transactions', [
            'type' => 'credit',
            'purpose' => 'deposit',
            'amount' => 1500.00,
        ]);
    }
}