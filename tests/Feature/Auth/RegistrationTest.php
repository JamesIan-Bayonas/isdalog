<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register_as_rider(): void
    {
        $response = $this->post('/register', [
            'name' => 'Logistics Courier',
            'email' => 'rider@isdalog.ph',
            'role' => 'rider',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'rider@isdalog.ph',
            'role' => 'rider',
        ]);
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_new_users_can_register_as_fisherman(): void
    {
        $response = $this->post('/register', [
            'name' => 'Galas Fisherman',
            'email' => 'fisherman@isdalog.ph',
            'role' => 'fisherman',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'fisherman@isdalog.ph',
            'role' => 'fisherman',
        ]);
        $response->assertRedirect(route('dashboard', absolute: false));
    }
}