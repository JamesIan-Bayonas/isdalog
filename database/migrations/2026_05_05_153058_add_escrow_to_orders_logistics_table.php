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
            // Tracks the flow of money and the 3% platform fee
            $table->enum('escrow_status', ['held', 'released', 'refunded'])->default('held')->after('status');
            $table->decimal('platform_fee', 8, 2)->default(0.00)->after('escrow_status');
            $table->decimal('seller_earnings', 10, 2)->default(0.00)->after('platform_fee');
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
