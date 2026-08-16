<?php

namespace Tests\Feature;

use App\Models\Listing;
use App\Models\RestrictedSpecies;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BfarAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_bfar_analytics_dashboard(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
        ]);

        Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Yellowfin Tuna',
            'weight_kg' => 120.00,
            'starting_price' => 12000.00,
            'current_bid' => 12000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
        ]);

        $response = $this->actingAs($admin)->get('/bfar/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('BfarDashboard')
            ->has('metrics')
            ->where('metrics.total_biomass_kg', 120)
            ->where('metrics.active_fishermen', 1)
            ->has('speciesDistribution', 1)
            ->has('catchVolumeTrends')
            ->has('portDistribution')
        );
    }

    public function test_non_admin_cannot_access_bfar_dashboard(): void
    {
        /** @var User $buyer */
        $buyer = User::factory()->create([
            'role' => 'buyer',
        ]);

        $response = $this->actingAs($buyer)->get('/bfar/dashboard');

        $response->assertStatus(403);
    }

    public function test_restricted_species_triggers_sustainability_alert(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'name' => 'Flagged Fisherman',
            'role' => 'fisherman',
        ]);

        // Register protected species
        DB::table('restricted_species')->insert([
            'species' => 'Giant Clam',
            'restriction_type' => 'Endangered Marine Invertebrate',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('listings')->insert([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu',
            'weight_kg' => 20.00,
            'starting_price' => 2000.00,
            'current_bid' => 2000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
            'created_at' => '2026-08-10 10:00:00',
            'updated_at' => '2026-08-10 10:00:00',
        ]);

        DB::table('listings')->insert([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol',
            'weight_kg' => 30.00,
            'starting_price' => 3000.00,
            'current_bid' => 3000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
            'created_at' => '2026-08-10 10:00:00',
            'updated_at' => '2026-08-10 10:00:00',
        ]);

        Listing::create([
            'user_id' => $fisherman->id,
            'fish_name' => 'Giant Clam',
            'weight_kg' => 15.00,
            'starting_price' => 5000.00,
            'current_bid' => 5000.00,
            'location' => 'Sicayab Port',
            'status' => 'active',
        ]);

        $response = $this->actingAs($admin)->get('/bfar/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('BfarDashboard')
            ->has('alerts', 1)
            ->where('alerts.0.fish_name', 'Giant Clam')
            ->where('alerts.0.fisherman_name', 'Flagged Fisherman')
        );
    }

    public function test_historical_catch_volume_trends_are_correctly_aggregated(): void
    {
        /** @var User $admin */
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        /** @var User $fisherman */
        $fisherman = User::factory()->create(['role' => 'fisherman']);

        DB::table('listings')->insert([
            'user_id' => $fisherman->id,
            'fish_name' => 'Lapu-Lapu',
            'weight_kg' => 20.00,
            'starting_price' => 2000.00,
            'current_bid' => 2000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
            'created_at' => '2026-08-10 10:00:00',
            'updated_at' => '2026-08-10 10:00:00',
        ]);

        DB::table('listings')->insert([
            'user_id' => $fisherman->id,
            'fish_name' => 'Tambakol',
            'weight_kg' => 30.00,
            'starting_price' => 3000.00,
            'current_bid' => 3000.00,
            'location' => 'Galas Port',
            'status' => 'completed',
            'created_at' => '2026-08-10 14:00:00',
            'updated_at' => '2026-08-10 14:00:00',
        ]);

        $response = $this->actingAs($admin)->get('/bfar/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('BfarDashboard')
            ->has('catchVolumeTrends', 1)
            ->where('catchVolumeTrends.0.date', '2026-08-10')
            ->where('catchVolumeTrends.0.biomass_kg', 50) // Removed .0 to match strict JSON integer parsing
            ->where('catchVolumeTrends.0.total_catches', 2)
        );
    }
}