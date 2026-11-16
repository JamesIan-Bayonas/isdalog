<?php // File: isdalog/tests/Feature/WebCatchFlowTest.php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WebCatchFlowTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $changes = []): array
    {
        return array_merge(['submission_id' => (string) Str::uuid(), 'species' => 'Bangus', 'weight' => '12.50',
            'price_per_kg' => '120.00', 'location' => 'Galas Port', 'lat' => 8.58, 'lon' => 123.33], $changes);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Http::fake();
        Storage::fake('public');
    }

    public function test_only_fishermen_can_open_capture_page(): void
    {
        $this->get('/sell-your-catch')->assertRedirect('/login');
        foreach (['buyer', 'rider', 'admin'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->get('/sell-your-catch')->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'fisherman']))->get('/sell-your-catch')->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Catches/Create')->has('ports', 4)->where('ports.0.name', 'Galas Port'));
    }

    public function test_web_publish_without_telegram_creates_owned_catch_and_discoverable_listing(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman', 'telegram_chat_id' => null]);
        $response = $this->actingAs($owner)->postJson('/catches', $this->payload())->assertCreated();
        $id = $response->json('data.listing_id');
        $this->assertDatabaseHas('catches', ['id' => $response->json('data.catch_id'), 'user_id' => $owner->id, 'weight' => 12.5]);
        $this->assertDatabaseHas('listings', ['id' => $id, 'user_id' => $owner->id, 'starting_price' => 1500, 'current_bid' => 1500, 'status' => 'active']);
        $this->get('/marketplace')->assertInertia(fn (Assert $page) => $page->component('Marketplace')->where('activeListings.0.id', $id));
        $this->get('/my-catches?listing='.$id)->assertInertia(fn (Assert $page) => $page->component('Catches/Manage')->where('listings.data.0.id', $id));
    }

    public function test_retrying_web_publication_returns_the_same_saved_result(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        $payload = $this->payload();
        $first = $this->postJson('/catches', $payload)->assertCreated()->json('data');
        $this->postJson('/catches', $payload)->assertOk()->assertJsonPath('data', $first);
        $this->assertDatabaseCount('catches', 1);
        $this->assertDatabaseCount('listings', 1);
    }

    public function test_web_photo_is_saved_with_both_records(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        $photo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
        $response = $this->postJson('/catches', $this->payload(['image_base64' => $photo]))->assertCreated();
        $catch = \App\Models\FishCatch::findOrFail($response->json('data.catch_id'));
        $this->assertDatabaseHas('listings', ['id' => $response->json('data.listing_id'), 'image_url' => $catch->image_url]);
        Storage::disk('public')->assertExists('catches/'.basename($catch->image_url));
    }

    public function test_precision_blank_name_and_overflow_are_rejected_without_records(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        foreach ([['species' => '   '], ['weight' => '12.501'], ['price_per_kg' => '120.001'], ['weight' => '999999.99', 'price_per_kg' => '99999999.99'], ['weight' => '0.01', 'price_per_kg' => '0.01']] as $change) {
            $this->postJson('/catches', $this->payload($change))->assertUnprocessable();
        }
        $this->assertDatabaseCount('catches', 0);
        $this->assertDatabaseCount('listings', 0);
    }

    public function test_starting_total_uses_integer_cent_rounding(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        $this->postJson('/catches', $this->payload(['weight' => '0.50', 'price_per_kg' => '0.99']))->assertCreated()->assertJsonPath('data.floor_price', 0.5);
        $this->assertDatabaseHas('listings', ['starting_price' => '0.50']);
    }
}
