<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityAndComplianceTest extends TestCase
{
    use RefreshDatabase;

    public function test_buyer_can_submit_compliance_documents_for_rider_upgrade(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'buyer',
            'status' => 'unverified',
        ]);

        $response = $this->actingAs($user)->patch('/profile/upgrade', [
            'requested_role' => 'rider',
            'vehicle_details' => 'Yamaha NMAX (XYZ 9876)',
        ]);

        $response->assertRedirect('/profile');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'requested_role' => 'rider',
            'vehicle_details' => 'Yamaha NMAX (XYZ 9876)',
            'status' => 'pending_review',
        ]);
    }

    public function test_buyer_can_submit_compliance_documents_for_fisherman_upgrade(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => 'buyer',
            'status' => 'unverified',
        ]);

        $response = $this->actingAs($user)->patch('/profile/upgrade', [
            'requested_role' => 'fisherman',
            'bfar_registration_number' => 'PH-999-888',
        ]);

        $response->assertRedirect('/profile');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'requested_role' => 'fisherman',
            'bfar_registration_number' => 'PH-999-888',
            'status' => 'pending_review',
        ]);
    }

    public function test_private_channel_blocks_unauthorized_socket_listeners(): void
    {
        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app-id',
        ]);

        // Purge the cached LogBroadcaster and immediately re-register our channel authorization logic
        \Illuminate\Support\Facades\Broadcast::purge();
        require base_path('routes/channels.php');

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        /** @var User $unauthorizedSniper */
        $unauthorizedSniper = User::factory()->create(['role' => 'buyer']);

        $listing = \App\Models\Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol',
            'weight_kg' => 10.00,
            'starting_price' => 1000.00,
            'current_bid' => 1000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = \Illuminate\Support\Facades\DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
        ]);

        // Attempt channel authorization logic directly
        $response = $this->actingAs($unauthorizedSniper)->post('/broadcasting/auth', [
            'channel_name' => "private-orders.{$orderId}",
            'socket_id' => '12345.67890',
        ]);

        $response->assertStatus(403);

        // Buyer authorization should succeed
        $buyerResponse = $this->actingAs($buyer)->post('/broadcasting/auth', [
            'channel_name' => "private-orders.{$orderId}",
            'socket_id' => '12345.67890',
        ]);
        
        $buyerResponse->assertStatus(200);
    }

    public function test_fisherman_cannot_place_bids_on_marketplace(): void
    {
        /** @var User $harvester */
        $harvester = User::factory()->create(['role' => 'fisherman']);

        /** @var User $otherFisherman */
        $otherFisherman = User::factory()->create(['role' => 'fisherman']);

        $listing = Listing::create([
            'user_id' => $harvester->id,
            'fish_name' => 'Ling',
            'weight_kg' => 12.00,
            'starting_price' => 1464.00,
            'current_bid' => 1464.00,
            'location' => 'Dipolog Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($otherFisherman)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 1600.00,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('listings', [
        'id' => $listing->id,
        'current_bid' => 1464.00,
]);
    }

    public function test_telegram_handshake_deep_link_binds_chat_id_to_fisherman(): void
{
    /** @var User $fisherman */
    $fisherman = User::factory()->create([
        'role' => 'fisherman',
        'telegram_chat_id' => null,
    ]);

    // 1. Generate deep-link pairing token
    $tokenResponse = $this->actingAs($fisherman)->postJson(route('profile.telegram.token'));
    $tokenResponse->assertOk();
    $token = $tokenResponse->json('token');

    // 2. Simulate Telegram Gateway Bot handshake callback
    $handshakeResponse = $this->postJson('/api/telegram/link', [
        'token' => $token,
        'telegram_chat_id' => '9988776655',
        'telegram_username' => 'fisherman_ian',
    ]);

    $handshakeResponse->assertOk();
    $handshakeResponse->assertJson(['status' => 'success']);

    // 3. Verify database reality
    $this->assertDatabaseHas('users', [
        'id' => $fisherman->id,
        'telegram_chat_id' => '9988776655',
    ]);
}
}