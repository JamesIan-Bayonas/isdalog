<?php // File: isdalog/database/migrations/2026_11_03_140000_persist_courier_location.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders_logistics', function (Blueprint $table) {
            $table->decimal('courier_latitude', 10, 7)->nullable();
            $table->decimal('courier_longitude', 10, 7)->nullable();
            $table->timestamp('location_recorded_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('orders_logistics', fn (Blueprint $table) => $table->dropColumn(['courier_latitude', 'courier_longitude', 'location_recorded_at']));
    }
};
