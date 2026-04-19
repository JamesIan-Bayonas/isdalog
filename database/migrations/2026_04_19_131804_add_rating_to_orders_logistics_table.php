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
        Schema::table('orders_logistics', function (Blueprint $table) {
            // This will hold our 1 to 5 star rating
            $table->integer('merchant_rating')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders_logistics', function (Blueprint $table) {
            //
        });
    }
};
