<?php // File: isdalog/database/migrations/2026_11_04_140000_add_account_support.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->foreignId('reviewer_id')->constrained('users')->restrictOnDelete();
            $t->string('action');
            $t->string('previous_role');
            $t->string('previous_status')->nullable();
            $t->string('resulting_role');
            $t->string('resulting_status');
            $t->text('reason');
            $t->timestamps();
        });
        Schema::create('support_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->string('category');
            $t->string('subject', 150);
            $t->text('message');
            $t->string('status')->default('open');
            $t->text('response')->nullable();
            $t->foreignId('reviewer_id')->nullable()->constrained('users')->restrictOnDelete();
            $t->timestamp('resolved_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_requests');
        Schema::dropIfExists('account_reviews');
    }
};
