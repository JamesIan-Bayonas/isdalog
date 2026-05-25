<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // 🔮 THE FUTURE-PROOF INJECTIONS
            // This column isolates what a user can see (fisherman, merchant, rider)
            $table->string('role')->default('merchant'); 
            
            // This column handles the Rider Verification state gates
            $table->string('status')->default('active'); // 'active', 'pending_verification', 'suspended'
            
            // Hard-links the Telegram loopback for the fisherman path
            $table->string('telegram_chat_id')->nullable()->unique(); 

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};