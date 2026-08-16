<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('catches', function (Blueprint $table) {
            $table->decimal('wind_speed', 5, 2)->nullable()->after('longitude');
            $table->decimal('temperature', 5, 2)->nullable()->after('wind_speed');
            $table->string('weather_condition')->nullable()->after('temperature');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('catches', function (Blueprint $table) {
            $table->dropColumn(['wind_speed', 'temperature', 'weather_condition']);
        });
    }
};