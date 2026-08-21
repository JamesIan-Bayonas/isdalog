<?php

namespace Tests\Feature;

use App\Events\CargoStatusUpdated;
use App\Events\RiderLocationUpdated;
use App\Jobs\SendSmsNotification;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class RiderFullLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_courier_lifecycle_from_claim_to_payout(): void
    {
        Event::fake([CargoStatusUpdated::class, RiderLocationUpdated::class]);
        Queue::fake();

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role'           => 'fisherman',
            'wallet_balance' => 0.00,
            'contact_number' => '09171112222',
        ]);

        /** @var User $rider */
        $rider = User::factory()->create([
            'name'           => 'Speedy Rider',
            'role'           => 'rider',
            'status'         => 'verified',
            'wallet_balance' => 0.00,
            'contact_number' => '09183334444',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role'           => 'buyer',
            'wallet_balance' => 5000.00,
            'contact_number' => '09195556666',
        ]);

        $listing = Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Yellowfin Tuna',
            'weight_kg'      => 20.00,
            'starting_price' => 2000.00,
            'current_bid'    => 2000.00,
            'location'       => 'Galas Port',
            'status'         => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id'     => $listing->id,
            'user_id'        => $buyer->id,
            'fisherman_id'   => $fisherman->id,
            'rider_id'       => null,
            'final_price'    => 2000.00,
            'delivery_fee'   => 150.00,
            'escrow_balance' => 2150.00,
            'pickup_otp'     => '123456',
            'delivery_otp'   => '654321',
            'logistics_type' => 'request_rider',
            'status'         => 'pending_dispatch',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // 1. Rider visits dispatch board and sees 1 available job
        $dispatchRes = $this->actingAs($rider)->get('/dispatch');
        $dispatchRes->assertStatus(200);
        $dispatchRes->assertInertia(fn ($page) => $page
            ->component('Dispatch')
            ->has('availableJobs', 1)
            ->has('activeRuns', 0)
        );

        // 2. Rider claims cargo using Harvester's Pickup OTP
        $claimRes = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '123456',
        ]);
        $claimRes->assertRedirect();
        $claimRes->assertSessionHasNoErrors();
        $this->assertDatabaseHas('orders_logistics', [
            'id'       => $orderId,
            'rider_id' => $rider->id,
            'status'   => 'en_route',
        ]);

        // 3. Rider streams live GPS telemetry
        $gpsRes = $this->actingAs($rider)->postJson("/dispatch/orders/{$orderId}/location", [
            'latitude'  => 8.5800,
            'longitude' => 123.3300,
        ]);
        $gpsRes->assertOk();
        Event::assertDispatched(RiderLocationUpdated::class);

        // 4. Rider delivers cargo using Buyer's Delivery OTP
        $deliverRes = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/deliver", [
            'delivery_otp' => '654321',
        ]);
        $deliverRes->assertRedirect();
        $deliverRes->assertSessionHasNoErrors();
        $this->assertDatabaseHas('orders_logistics', [
            'id'     => $orderId,
            'status' => 'delivered',
        ]);

        // 5. Buyer confirms delivery & releases escrow
        $confirmRes = $this->actingAs($buyer)->post("/orders/{$orderId}/confirm", [
            'fisherman_rating' => 5,
            'rider_rating'     => 5,
        ]);
        $confirmRes->assertRedirect();
        $confirmRes->assertSessionHasNoErrors();

        // 6. Verify Rider received 100% of Delivery Fee (₱150)
        $this->assertEquals(150.00, (float) $rider->fresh()->wallet_balance);

        // 7. Rider dashboard reflects 1 completed run and credited balance
        $dashRes = $this->actingAs($rider)->get('/dashboard');
        $dashRes->assertStatus(200);
        $dashRes->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('stats.completedRuns', 1)
            ->where('stats.walletBalance', 150)
            ->has('dispatchLogs', 1)
        );
    }
}