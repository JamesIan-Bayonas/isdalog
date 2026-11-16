<?php // File: isdalog/tests/Feature/CatchImageStorageTest.php
// File: tests/Feature/CatchImageStorageTest.php
namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CatchImageStorageTest extends TestCase
{
    use RefreshDatabase;

    public function test_catch_ingestion_stores_image_on_public_disk(): void
    {
        $diskName = 'public';
        Storage::fake($diskName);

        /** @var User $fisherman */
        $fisherman = User::factory()->create([
            'role' => 'fisherman',
            'telegram_chat_id' => '99887766',
        ]);

        $base64Sample = 'data:image/jpeg;base64,' . 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';

        config(['ingestion.bot_secret' => 'test-secret']);
        $this->withHeader('X-Isdalog-Bot-Secret', 'test-secret');
        $response = $this->postJson('/api/catches', [
            'submission_id' => (string) \Illuminate\Support\Str::uuid(),
            'telegram_chat_id' => '99887766',
            'species' => 'Bangus',
            'weight' => 10.5,
            'price_per_kg' => 220,
            'location' => 'Galas Port',
            'image_base64' => $base64Sample,
        ]);

        $response->assertSuccessful();

        $this->assertDatabaseHas('catches', [
            'species' => 'Bangus',
        ]);

        $catch = \App\Models\FishCatch::where('species', 'Bangus')->first();
        $this->assertNotNull($catch->image_url);

        // Extract relative storage path regardless of local vs CDN url formatting
        $fileName = basename($catch->image_url);
        
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);
        $disk->assertExists('catches/' . $fileName);
    }
}