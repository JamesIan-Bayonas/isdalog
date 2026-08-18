<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catches', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('species');
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->string('image_url')->nullable()->after('fish_name');
        });
    }

    public function down(): void
    {
        Schema::table('catches', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });

        Schema::table('listings', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};