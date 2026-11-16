<?php // File: isdalog/database/migrations/2026_11_04_090000_link_listing_catch.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void { Schema::table('listings', fn (Blueprint $table) => $table->foreignId('catch_id')->nullable()->constrained('catches')->nullOnDelete()); }
    public function down(): void { Schema::table('listings', fn (Blueprint $table) => $table->dropConstrainedForeignId('catch_id')); }
};
