<?php // File: isdalog/tests/Feature/IntegrationHonestyTest.php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class IntegrationHonestyTest extends TestCase
{
    use RefreshDatabase;

    private function order(string $status = 'en_route', string $mode = 'request_rider'): array
    {
        Event::fake();
        $seller = User::factory()->create(['role' => 'fisherman']);
        $buyer = User::factory()->create(['role' => 'buyer', 'wallet_balance' => 1000]);
        $rider = User::factory()->create(['role' => 'rider', 'status' => 'verified']);
        $batch = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'completed']);
        $id = DB::table('orders_logistics')->insertGetId(['listing_id' => $batch->id, 'user_id' => $buyer->id,
            'fisherman_id' => $seller->id, 'rider_id' => $status === 'pending_dispatch' ? null : $rider->id,
            'final_price' => 100, 'escrow_balance' => 100, 'logistics_type' => $mode, 'status' => $status,
            'pickup_otp' => '123456', 'delivery_otp' => '654321', 'created_at' => now(), 'updated_at' => now()]);

        return [$id, $seller, $buyer, $rider];
    }

    public function test_production_cannot_mint_demo_credit_even_if_driver_is_demo(): void
    {
        [, , $buyer] = $this->order();
        config(['app.env' => 'production', 'integrations.funding_driver' => 'demo']);
        $this->actingAs($buyer)->postJson('/wallet/deposit', ['amount' => 100])->assertStatus(503);
        $this->assertEquals(1000, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseCount('wallet_transactions', 0);
    }

    public function test_demo_credit_is_labelled_and_can_be_disabled_locally(): void
    {
        [, , $buyer] = $this->order();
        config(['integrations.funding_driver' => 'demo']);
        $this->actingAs($buyer)->postJson('/wallet/deposit', ['amount' => 50])->assertOk()->assertJsonPath('message', 'Demo credit recorded. No real payment was made.');
        config(['integrations.funding_driver' => 'disabled']);
        $this->postJson('/wallet/deposit', ['amount' => 50])->assertStatus(503);
        $this->assertEquals(1050, $buyer->fresh()->wallet_balance);
    }

    public function test_sms_simulation_logs_no_private_data_and_production_reports_unavailable(): void
    {
        config(['app.env' => 'local', 'integrations.sms_driver' => 'log']);
        Log::shouldReceive('info')->once()->with('SMS simulation recorded. No text message was sent.');
        $this->assertTrue(\App\Services\SmsNotificationService::send('09171234567', 'Code 123456'));
        config(['app.env' => 'production']);
        Log::shouldReceive('warning')->once()->with('SMS unavailable: no live provider is configured.');
        $this->assertFalse(\App\Services\SmsNotificationService::send('09171234567', 'Code 123456'));
    }

    public function test_sms_job_failure_is_visible_and_queue_payload_is_encrypted(): void
    {
        config(['integrations.sms_driver' => 'disabled']);
        $job = new \App\Jobs\SendSmsNotification('09171234567', 'Code 123456');
        $this->assertInstanceOf(\Illuminate\Contracts\Queue\ShouldBeEncrypted::class, $job);
        $this->expectException(\RuntimeException::class);
        $job->handle();
    }

    public function test_courier_payload_excludes_both_codes_and_other_roles_cannot_open_dispatch(): void
    {
        [, $seller, $buyer, $rider] = $this->order();
        $this->actingAs($buyer)->get('/dispatch')->assertForbidden();
        $this->actingAs($seller)->get('/dispatch')->assertForbidden();
        $this->actingAs($rider)->get('/dispatch')->assertInertia(fn (Assert $page) => $page->component('Dispatch')
            ->missing('activeRuns.0.pickup_otp')->missing('activeRuns.0.delivery_otp'));
        $this->actingAs($seller)->get('/dashboard')->assertInertia(fn (Assert $page) => $page->component('Dashboard')->missing('salesHistory.0.delivery_otp'));
    }

    public function test_self_pickup_cannot_be_claimed_by_a_courier(): void
    {
        [$id, , , $rider] = $this->order('pending_dispatch', 'self_pickup');
        $this->actingAs($rider)->post('/dispatch/orders/'.$id.'/claim', ['pickup_otp' => '123456'])->assertSessionHasErrors('error');
        $this->assertDatabaseHas('orders_logistics', ['id' => $id, 'rider_id' => null]);
    }

    public function test_revoked_rider_cannot_deliver_or_update_location(): void
    {
        [$id, , , $rider] = $this->order();
        $rider->update(['status' => 'unverified']);
        $this->actingAs($rider)->post('/dispatch/orders/'.$id.'/deliver', ['delivery_otp' => '654321'])->assertForbidden();
        $this->postJson('/dispatch/orders/'.$id.'/location', ['latitude' => 8.5, 'longitude' => 123])->assertForbidden();
    }

    public function test_snapshot_persists_location_reports_staleness_and_discloses_no_codes(): void
    {
        [$id, , $buyer, $rider] = $this->order();
        $this->actingAs($buyer)->getJson('/orders/'.$id.'/telemetry')->assertOk()->assertJsonPath('location_state', 'unavailable')->assertJsonPath('latitude', null);
        $this->actingAs($rider)->postJson('/dispatch/orders/'.$id.'/location', ['latitude' => 8.5, 'longitude' => 123])->assertOk();
        $this->actingAs($buyer)->getJson('/orders/'.$id.'/telemetry')->assertOk()->assertJsonPath('latitude', 8.5)
            ->assertJsonPath('location_state', 'recent')->assertJsonMissingPath('pickup_otp')->assertJsonMissingPath('delivery_otp');
        $this->travel(3)->minutes();
        $this->getJson('/orders/'.$id.'/telemetry')->assertJsonPath('location_state', 'stale');
        $this->actingAs(User::factory()->create())->getJson('/orders/'.$id.'/telemetry')->assertForbidden();
    }

    public function test_consumed_buyer_delivery_code_is_not_sent_to_marketplace(): void
    {
        [, , $buyer] = $this->order('delivered');
        $this->actingAs($buyer)->get('/marketplace')->assertInertia(fn (Assert $page) => $page->component('Marketplace')->where('activeOrders.0.delivery_otp', null));
    }

    public function test_repeated_incorrect_pickup_attempts_are_throttled(): void
    {
        [$id, , , $rider] = $this->order('pending_dispatch');
        $this->actingAs($rider);
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->post('/dispatch/orders/'.$id.'/claim', ['pickup_otp' => '000000'])->assertSessionHasErrors('pickup_otp');
        }
        $this->post('/dispatch/orders/'.$id.'/claim', ['pickup_otp' => '123456'])->assertStatus(429);
        $this->assertDatabaseHas('orders_logistics', ['id' => $id, 'status' => 'pending_dispatch', 'rider_id' => null]);
    }

    public function test_order_serialization_never_exposes_handover_codes(): void
    {
        [$id] = $this->order();
        $serialized = \App\Models\Order::findOrFail($id)->toArray();
        $this->assertArrayNotHasKey('pickup_otp', $serialized);
        $this->assertArrayNotHasKey('delivery_otp', $serialized);
    }

    public function test_synchronous_sms_failure_does_not_turn_committed_purchase_into_http_failure(): void
    {
        [, $seller, $buyer] = $this->order();
        $seller->update(['contact_number' => '09171234567']);
        $buyer->update(['contact_number' => '09179876543']);
        config(['app.env' => 'production', 'integrations.sms_driver' => 'disabled', 'queue.default' => 'sync']);
        $batch = Listing::factory()->create(['user_id' => $seller->id, 'status' => 'active', 'current_bid' => 100]);
        Log::spy();
        $this->actingAs($buyer)->post(route('orders.store', $batch), ['logistics_type' => 'self_pickup'])->assertRedirect(route('dashboard'))->assertSessionHasNoErrors();
        $this->assertEquals(900, $buyer->fresh()->wallet_balance);
        $this->assertDatabaseHas('orders_logistics', ['listing_id' => $batch->id, 'escrow_balance' => 100]);
        Log::shouldHaveReceived('warning')->with('SMS job could not be delivered or queued after commit. Domain records remain committed.')->twice();
    }
}
