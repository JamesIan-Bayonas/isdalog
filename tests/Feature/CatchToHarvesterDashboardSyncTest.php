<?php

namespace Tests\Feature;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatchToHarvesterDashboardSyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_catch_logging_synchronizes_biomass_and_active_auction_to_harvester_dashboard(): void
    {
        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'name'             => 'Ian the Fisherman',
            'role'             => 'fisherman',
            'telegram_chat_id' => '100200300',
            'wallet_balance'   => 0.00,
        ]);

        FishCatch::create([
            'user_id'           => $fisherman->id,
            'species'           => 'Ling',
            'weight'            => 12.00,
            'location'          => 'Dipolog Port',
            'wind_speed'        => 10.50,
            'temperature'       => 28.00,
            'weather_condition' => 'WMO-0',
            'logged_at'         => now(),
        ]);

        Listing::create([
            'user_id'        => $fisherman->id,
            'fish_name'      => 'Ling',
            'weight_kg'      => 12.00,
            'starting_price' => 1464.00,
            'current_bid'    => 1464.00,
            'location'       => 'Dipolog Port',
            'status'         => 'active',
        ]);

        $dashResponse = $this->actingAs($fisherman)->get('/dashboard');

        $dashResponse->assertStatus(200);
        $dashResponse->assertInertia(fn ($page) => $page
            ->component('Dashboard')
            ->where('role', 'fisherman')
            ->where('metrics.totalWeight', 12)
            ->where('stats.loggedBiomass', 12)
            ->has('activeListings', 1)
            ->where('activeListings.0.fish_name', 'Ling')
            ->where('activeListings.0.starting_price', '1464.00')
            ->has('recentActivity', 1)
            ->where('recentActivity.0.species', 'Ling')
        );
    }
}