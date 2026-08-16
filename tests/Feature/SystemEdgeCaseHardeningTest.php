<?php

namespace Tests\Feature;

use App\Events\CatchBidUpdated;
use App\Models\Listing;
use App\Models\User;
use App\Services\PayoutDisbursementService;
use App\Services\WeatherTelemetryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SystemEdgeCaseHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_bid_submission_rejects_lower_or_equal_amount_under_atomic_lock(): void
    {
        Event::fake([CatchBidUpdated::class]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Yellowfin Tuna Batch',
            'weight_kg' => 50.00,
            'starting_price' => 5000.00,
            'current_bid' => 5500.00,
            'location' => 'Galas Port',
            'status' => 'active',
        ]);

        // Attempt to submit a bid lower than the current lock value
        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 5400.00,
        ]);

        $response->assertSessionHasErrors('bid_amount');
        $this->assertEquals(5500.00, (float) $listing->fresh()->current_bid);
        Event::assertNotDispatched(CatchBidUpdated::class);
    }

    public function test_bid_submission_fails_gracefully_if_listing_closed_concurrently(): void
    {
        Event::fake([CatchBidUpdated::class]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        /** @var User $buyer */
        $buyer = User::factory()->create(['role' => 'buyer']);

        $listing = Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Blue Marlin',
            'weight_kg' => 40.00,
            'starting_price' => 4000.00,
            'current_bid' => 4000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $response = $this->actingAs($buyer)->post("/listings/{$listing->id}/bids", [
            'bid_amount' => 6000.00,
        ]);

        $response->assertSessionHasErrors('bid_amount');
        $this->assertEquals(4000.00, (float) $listing->fresh()->current_bid);
        Event::assertNotDispatched(CatchBidUpdated::class);
    }

    public function test_weather_telemetry_gracefully_degrades_when_open_meteo_times_out(): void
    {
        Http::fake([
            'https://api.open-meteo.com/v1/forecast*' => Http::response(null, 500),
        ]);

        $telemetry = WeatherTelemetryService::capture(8.58, 123.33);

        $this->assertNull($telemetry['wind_speed']);
        $this->assertNull($telemetry['temperature']);
        $this->assertNull($telemetry['weather_condition']);
    }

    public function test_payout_disbursement_service_returns_structured_sandbox_reference(): void
    {
        $result = PayoutDisbursementService::disburse(
            'gcash',
            '09170001122',
            'Juan Fisherman',
            2500.00
        );

        $this->assertTrue($result['success']);
        $this->assertNotNull($result['reference_id']);
        $this->assertStringStartsWith('DSB-', $result['reference_id']);
    }
}