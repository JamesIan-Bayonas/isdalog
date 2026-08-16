<?php

namespace Tests\Feature;

use App\Jobs\SendSmsNotification;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class AsyncSmsQueueTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_creation_pushes_sms_jobs_to_queue_worker(): void
    {
        Queue::fake();

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'contact_number' => '09171234567',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'contact_number' => '09187654321',
            'wallet_balance' => 5000.00,
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Maya-Maya Batch',
            'weight_kg' => 25.00,
            'starting_price' => 2500.00,
            'current_bid' => 2500.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/order", [
            'logistics_type' => 'request_rider',
        ]);

        $response->assertRedirect(route('dashboard'));

        Queue::assertPushed(SendSmsNotification::class, 2);
        Queue::assertPushed(SendSmsNotification::class, function ($job) use ($fisherman) {
            return $job->phoneNumber === $fisherman->contact_number
                && str_contains($job->message, 'Handshake Pickup OTP');
        });
        Queue::assertPushed(SendSmsNotification::class, function ($job) use ($buyer) {
            return $job->phoneNumber === $buyer->contact_number
                && str_contains($job->message, 'Delivery Confirmation OTP');
        });
    }

    public function test_courier_claiming_cargo_pushes_sms_job_to_buyer(): void
    {
        Queue::fake();

        /** @var User $rider */
        $rider = User::factory()->create([
            'name' => 'Fast Rider',
            'role' => 'rider',
            'status' => 'verified',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'contact_number' => '09191112222',
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Yellowfin Tuna',
            'weight_kg' => 30.00,
            'starting_price' => 3000.00,
            'current_bid' => 3000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 3000.00,
            'escrow_balance' => 3000.00,
            'pickup_otp' => '555555',
            'delivery_otp' => '666666',
            'logistics_type' => 'request_rider',
            'status' => 'pending_dispatch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($rider)->post("/dispatch/orders/{$orderId}/claim", [
            'pickup_otp' => '555555',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        Queue::assertPushed(SendSmsNotification::class, 1);
        Queue::assertPushed(SendSmsNotification::class, function ($job) use ($buyer) {
            return $job->phoneNumber === $buyer->contact_number
                && str_contains($job->message, 'EN ROUTE');
        });
    }

    public function test_buyer_confirming_delivery_pushes_escrow_sms_job_to_harvester(): void
    {
        Queue::fake();

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'contact_number' => '09175556666',
        ]);

        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
            'wallet_balance' => 0.00,
        ]);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu Batch',
            'weight_kg' => 10.00,
            'starting_price' => 1000.00,
            'current_bid' => 1000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $orderId = DB::table('orders_logistics')->insertGetId([
            'listing_id' => $listing->id,
            'user_id' => $buyer->id,
            'fisherman_id' => $fisherman->id,
            'rider_id' => null,
            'final_price' => 1000.00,
            'escrow_balance' => 1000.00,
            'logistics_type' => 'request_rider',
            'status' => 'delivered',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->post("/orders/{$orderId}/confirm", [
            'rating' => 5,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasNoErrors();

        Queue::assertPushed(SendSmsNotification::class, 1);
        Queue::assertPushed(SendSmsNotification::class, function ($job) use ($fisherman) {
            return $job->phoneNumber === $fisherman->contact_number
                && str_contains($job->message, '₱970.00 has been credited');
        });
    }
}