<?php // File: isdalog/tests/Feature/MarketVocabularyTest.php

namespace Tests\Feature;

use App\Models\FishCatch;
use App\Models\Listing;
use App\Models\User;
use App\Services\MarketVocabulary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MarketVocabularyTest extends TestCase
{
    use RefreshDatabase;

    private function listing(string $name): Listing
    {
        return Listing::factory()->create(['fish_name' => $name, 'location' => 'Galas Port', 'status' => 'active', 'ends_at' => now()->addDay(), 'weight_kg' => 10, 'current_bid' => 100]);
    }

    private function milkfish(): object
    {
        return DB::table('vocabulary_terms')->where('code', 'species-milkfish')->first();
    }

    private function data(object $term, array $changes = []): array
    {
        return array_merge(['kind' => $term->kind, 'code' => $term->code, 'display_name' => $term->display_name, 'latitude' => $term->latitude, 'longitude' => $term->longitude, 'aliases' => [], 'source_note' => 'Administrator checked vocabulary reference.'], $changes);
    }

    public function test_known_aliases_search_both_markets_without_guessing_unknown_names(): void
    {
        $a = $this->listing('Bangus');
        $b = $this->listing('Milkfish');
        $unknown = $this->listing('Uncertain Bangus mix');
        $this->assertSame($a->species_term_id, $b->species_term_id);
        $this->assertNotNull($a->species_term_id);
        $this->assertNull($unknown->species_term_id);
        $this->get('/market-preview?q=Milkfish')->assertInertia(fn (Assert $p) => $p->has('listings.data', 2));
        $this->actingAs(User::factory()->create(['role' => 'buyer']))->get('/marketplace?q=Chanos%20chanos')->assertInertia(fn (Assert $p) => $p->has('activeListings', 2));
        $this->get('/marketplace?q=%25')->assertInertia(fn (Assert $p) => $p->has('activeListings', 0));
    }

    public function test_catalogue_rename_preserves_ids_original_labels_and_search_and_records_audit(): void
    {
        $batch = $this->listing('Bangus');
        $before = $batch->fresh()->getAttributes();
        $term = $this->milkfish();
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->patch('/admin/vocabulary/'.$term->id, $this->data($term, ['display_name' => 'Milkfish reference', 'aliases' => ['Bangos']]))->assertSessionHasNoErrors();
        $this->assertSame($before, $batch->fresh()->getAttributes());
        $this->assertSame($term->id, MarketVocabulary::resolve('species', '  MILKFISH  '));
        $this->get('/marketplace?q=Bangos')->assertInertia(fn (Assert $p) => $p->has('activeListings', 1));
        $this->assertDatabaseHas('vocabulary_changes', ['term_id' => $term->id, 'actor_user_id' => $admin->id]);
        $this->patch('/admin/vocabulary/'.$term->id, $this->data($term, ['code' => 'different-code']))->assertSessionHasErrors('code');
        $port = DB::table('vocabulary_terms')->where('code', 'port-galas')->first();
        $this->patch('/admin/vocabulary/'.$port->id, $this->data($port, ['display_name' => 'Galas landing reference', 'aliases' => ['Galas hub']]))->assertSessionHasNoErrors();
        $this->get('/marketplace?port=Galas%20hub')->assertInertia(fn (Assert $p) => $p->has('activeListings', 1));
        $this->assertSame('Galas Port', $batch->fresh()->location);
    }

    public function test_conflicting_aliases_invalid_coordinates_and_non_admin_writes_are_rejected(): void
    {
        $term = $this->milkfish();
        $buyer = User::factory()->create(['role' => 'buyer']);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($buyer)->get('/admin/vocabulary')->assertForbidden();
        $this->post('/admin/vocabulary', $this->data($term))->assertForbidden();
        $this->patch('/admin/vocabulary/'.$term->id, $this->data($term))->assertForbidden();
        $this->actingAs($admin)->post('/admin/vocabulary', ['kind' => 'species', 'code' => 'other-fish', 'display_name' => 'Other fish', 'aliases' => ['Bangus'], 'source_note' => 'Attempt to assign a conflicting alias.'])->assertSessionHasErrors('aliases');
        $this->assertDatabaseMissing('vocabulary_terms', ['code' => 'other-fish']);
        $port = DB::table('vocabulary_terms')->where('code', 'port-galas')->first();
        $this->patch('/admin/vocabulary/'.$port->id, $this->data($port, ['latitude' => 91]))->assertSessionHasErrors('latitude');
        $this->assertDatabaseCount('vocabulary_changes', 0);
    }

    public function test_legacy_exact_linking_is_explicit_and_preserves_raw_records_and_timestamps(): void
    {
        $batch = $this->listing('Bangus');
        $unknown = $this->listing('Unknown mixed batch');
        DB::table('listings')->where('id', $batch->id)->update(['species_term_id' => null, 'port_term_id' => null]);
        $before = $batch->fresh();
        $this->artisan('vocabulary:link')->assertSuccessful();
        $this->assertNull($batch->fresh()->species_term_id);
        $this->artisan('vocabulary:link --apply')->assertSuccessful();
        $this->assertSame($this->milkfish()->id, $batch->fresh()->species_term_id);
        $this->assertSame($before->updated_at->toISOString(), $batch->fresh()->updated_at->toISOString());
        $this->assertSame('Bangus', $batch->fresh()->fish_name);
        $this->assertNull($unknown->fresh()->species_term_id);
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin)->get('/admin/vocabulary')->assertInertia(fn (Assert $p) => $p->where('unlinked.data.0.fish_name', 'Unknown mixed batch'));
        $this->post('/admin/vocabulary/listing/'.$unknown->id.'/link')->assertSessionHasNoErrors();
        $this->assertNull($unknown->fresh()->species_term_id);
    }

    public function test_shared_catch_ingestion_links_known_labels_and_retains_unrecognized_input(): void
    {
        $fisherman = User::factory()->create(['role' => 'fisherman']);
        $data = ['submission_id' => (string) Str::uuid(), 'species' => 'Bangus', 'weight' => 10, 'price_per_kg' => 100, 'location' => 'Galas Port', 'lat' => 8.58, 'lon' => 123.33, 'wind_speed' => 1, 'temperature' => 28, 'weather_condition' => 'Clear'];
        $response = $this->actingAs($fisherman)->postJson('/catches', $data)->assertCreated();
        $catch = FishCatch::findOrFail($response->json('data.catch_id'));
        $listing = Listing::findOrFail($response->json('data.listing_id'));
        $this->assertSame($this->milkfish()->id, $catch->species_term_id);
        $this->assertSame($catch->species_term_id, $listing->species_term_id);
        $this->assertSame('Bangus', $catch->species);
        $this->assertNotNull($listing->port_term_id);
        $this->postJson('/catches', $data)->assertOk();
        $this->assertDatabaseCount('catches', 1);
        $data['submission_id'] = (string) Str::uuid();
        $data['species'] = 'Unidentified fish';
        $data['location'] = 'Unknown beach';
        $response = $this->postJson('/catches', $data)->assertCreated();
        $catch = FishCatch::findOrFail($response->json('data.catch_id'));
        $this->assertNull($catch->species_term_id);
        $this->assertNull($catch->port_term_id);
        $this->assertSame('Unknown beach',$catch->location);
    }
}
