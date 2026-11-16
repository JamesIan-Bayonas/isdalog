<?php

// File: isdalog/tests/Feature/AuthenticatedCatchTest.php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthenticatedCatchTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['ingestion.bot_secret' => 'test-secret']);
        Http::fake();
        Storage::fake('public');
    }

    private function payload(): array
    {
        return ['submission_id' => (string) Str::uuid(), 'species' => 'Bangus', 'weight' => 5,
            'wind_speed' => 1, 'temperature' => 25, 'weather_condition' => 'Clear'];
    }

    public function test_bot_requires_secret_and_linked_fisherman(): void
    {
        User::factory()->create(['role' => 'fisherman']);
        $data = $this->payload() + ['telegram_chat_id' => '123'];
        $this->postJson('/api/catches', $data)->assertUnauthorized();
        $this->withHeader('X-Isdalog-Bot-Secret', 'wrong')->postJson('/api/catches', $data)->assertUnauthorized();
        $this->withHeader('X-Isdalog-Bot-Secret', 'test-secret')->postJson('/api/catches', $data)->assertForbidden();
        User::factory()->create(['role' => 'buyer', 'telegram_chat_id' => '123']);
        $this->postJson('/api/catches', $data)->assertForbidden();
        $this->assertDatabaseCount('catches', 0);
    }

    public function test_bot_retry_returns_same_records_and_changed_replay_is_rejected(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman', 'telegram_chat_id' => '123']);
        $data = $this->payload() + ['telegram_chat_id' => '123'];
        $this->withHeader('X-Isdalog-Bot-Secret', 'test-secret');
        $first = $this->postJson('/api/catches', $data)->assertCreated();
        $this->postJson('/api/catches', $data)->assertOk()->assertJsonPath('data.catch_id', $first->json('data.catch_id'));
        $data['weight'] = 6;
        $this->postJson('/api/catches', $data)->assertConflict();
        $this->assertDatabaseCount('catches', 1);
        $this->assertDatabaseCount('listings', 1);
        $this->assertDatabaseHas('catches', ['user_id' => $owner->id]);
    }

    public function test_web_identity_cannot_be_overridden_and_other_roles_are_denied(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $other = User::factory()->create(['role' => 'fisherman', 'telegram_chat_id' => '999']);
        $this->actingAs($owner)->postJson('/catches', $this->payload() + ['telegram_chat_id' => '999'])->assertForbidden();
        $this->postJson('/catches', $this->payload() + ['user_id' => $other->id])->assertCreated();
        $this->assertDatabaseHas('catches', ['user_id' => $owner->id]);
        foreach (['buyer', 'rider', 'admin'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->postJson('/catches', $this->payload())->assertForbidden();
        }
        $this->assertDatabaseCount('catches', 1);
    }

    public function test_invalid_image_or_coordinates_leave_no_records(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        $this->postJson('/catches', $this->payload() + ['image_base64' => base64_encode('not an image')])->assertUnprocessable();
        $this->postJson('/catches', $this->payload() + ['lat' => 91])->assertUnprocessable();
        $this->assertDatabaseCount('catches', 0);
        $this->assertDatabaseCount('catch_submissions', 0);
    }

    public function test_link_is_authenticated_single_use_and_handshake_works(): void
    {
        $owner = User::factory()->create(['role' => 'fisherman']);
        $token = Str::random(32);
        Cache::put('telegram_bind_'.$token, $owner->id, 600);
        $data = ['token' => $token, 'telegram_chat_id' => '123'];
        $this->postJson('/api/telegram/link', $data)->assertUnauthorized();
        $this->withHeader('X-Isdalog-Bot-Secret', 'test-secret')->postJson('/api/telegram/link', $data)->assertOk();
        $this->postJson('/api/telegram/link', $data)->assertUnprocessable();
        $this->postJson('/api/telegram/handshake', ['telegram_chat_id' => '123'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $owner->id, 'telegram_chat_id' => '123']);
    }

    public function test_disabled_bot_credential_fails_closed(): void
    {
        config(['ingestion.bot_secret' => '']);
        $this->withHeader('X-Isdalog-Bot-Secret', '')->postJson('/api/catches', $this->payload())->assertUnauthorized();
    }

    public function test_listing_failure_rolls_back_catch_and_removes_image(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        \App\Models\Listing::creating(function () {
            throw new \RuntimeException('Synthetic persistence failure');
        });
        try {
            $this->postJson('/catches', $this->payload() + ['image_base64' => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='])->assertStatus(500);
            $this->assertDatabaseCount('catches', 0);
            $this->assertDatabaseCount('listings', 0);
            $this->assertDatabaseCount('catch_submissions', 0);
            $this->assertSame([], Storage::disk('public')->allFiles());
        } finally {
            \App\Models\Listing::flushEventListeners();
        }
    }

    public function test_storage_failure_prevents_publication(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'fisherman']));
        Storage::shouldReceive('disk')->with('public')->andReturnSelf();
        Storage::shouldReceive('put')->once()->andReturn(false);
        Storage::shouldReceive('delete')->once()->andReturn(true);
        $this->postJson('/catches', $this->payload() + ['image_base64' => 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='])->assertStatus(500);
        $this->assertDatabaseCount('catches', 0);
        $this->assertDatabaseCount('catch_submissions', 0);
    }
}
