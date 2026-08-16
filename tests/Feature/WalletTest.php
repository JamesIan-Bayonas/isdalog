<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_buyer_can_deposit_funds_to_virtual_wallet(): void
    {
        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 0.00,
        ]);

        $response = $this->actingAs($buyer)->post('/wallet/deposit', [
            'amount' => 5000.00,
            'payment_method' => 'gcash',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();
        $this->assertEquals(5000.00, (float) $buyer->fresh()->wallet_balance);
    }

    public function test_wallet_deposit_rejects_negative_or_below_minimum_amount(): void
    {
        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 100.00,
        ]);

        $response = $this->actingAs($buyer)->post('/wallet/deposit', [
            'amount' => 10.00,
            'payment_method' => 'gcash',
        ]);

        $response->assertSessionHasErrors('amount');
        $this->assertEquals(100.00, (float) $buyer->fresh()->wallet_balance);
    }

    public function test_unauthenticated_user_cannot_deposit_funds(): void
    {
        $response = $this->post('/wallet/deposit', [
            'amount' => 1000.00,
            'payment_method' => 'maya',
        ]);

        $response->assertRedirect('/login');
    }
}