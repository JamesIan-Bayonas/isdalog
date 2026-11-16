<?php // File: isdalog/database/migrations/2026_11_03_130000_add_listing_expiration.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->timestamp('expired_at')->nullable();
            $table->index(['status', 'ends_at'], 'listings_expiry_index');
        });
    }

    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropIndex('listings_expiry_index');
            $table->dropColumn('expired_at');
        });
    }
};
